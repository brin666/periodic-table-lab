import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createServer as createTcpServer } from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createFeedbackServer } from "./feedback-server.mjs";

const ORIGIN = "https://periodic.test";
const TOKEN = "do-not-leak-test-token";
const SERVER_ENTRY = fileURLToPath(
  new URL("./feedback-server.mjs", import.meta.url),
);

async function reservePort() {
  const server = createTcpServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function startFeedbackProcess(script, t) {
  const dataDir = await mkdtemp(
    path.join(os.tmpdir(), "periodic-feedback-entry-test-"),
  );
  const port = await reservePort();
  const child = spawn(process.execPath, [script], {
    env: {
      ...process.env,
      FEEDBACK_DATA_DIR: dataDir,
      FEEDBACK_GITHUB_OWNER: "acme",
      FEEDBACK_GITHUB_REPO: "periodic-feedback",
      FEEDBACK_GITHUB_TOKEN: "",
      FEEDBACK_ALLOWED_ORIGINS: ORIGIN,
      FEEDBACK_HOST: "127.0.0.1",
      FEEDBACK_PORT: String(port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let closed = false;
  let stopPromise;
  const closedPromise = new Promise((resolve) => {
    child.once("close", () => {
      closed = true;
      resolve();
    });
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => (stdout += chunk));
  child.stderr.on("data", (chunk) => (stderr += chunk));

  const stop = () => {
    if (!stopPromise) {
      stopPromise = (async () => {
        if (!closed) {
          child.kill("SIGTERM");
          await Promise.race([
            closedPromise,
            new Promise((resolve) => setTimeout(resolve, 3_000)),
          ]);
          if (!closed) {
            child.kill("SIGKILL");
            await closedPromise;
          }
        }
        await rm(dataDir, { recursive: true, force: true });
      })();
    }
    return stopPromise;
  };
  t.after(stop);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Feedback process did not listen in time. stdout=${stdout} stderr=${stderr}`,
        ),
      );
    }, 5_000);
    const ready = () => {
      if (!stdout.includes("反馈接收服务已启动：")) return;
      clearTimeout(timeout);
      resolve();
    };
    child.stdout.on("data", ready);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code, signal) => {
      if (stdout.includes("反馈接收服务已启动：")) return;
      clearTimeout(timeout);
      reject(
        new Error(
          `Feedback process exited before listening (${code ?? signal}). stdout=${stdout} stderr=${stderr}`,
        ),
      );
    });
  });

  return { port, stop };
}

async function makeServerDirectoryAlias(
  t,
  prefix,
  entryName = path.basename(SERVER_ENTRY),
) {
  const aliasRoot = await mkdtemp(path.join(os.tmpdir(), prefix));
  const aliasDirectory = path.join(aliasRoot, "current-server");
  await symlink(
    path.dirname(SERVER_ENTRY),
    aliasDirectory,
    process.platform === "win32" ? "junction" : "dir",
  );
  t.after(() => rm(aliasRoot, { recursive: true, force: true }));
  return path.join(aliasDirectory, entryName);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makePng() {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    return Buffer.concat([length, Buffer.from(type), data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(2, 0);
  header.writeUInt32BE(2, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", Buffer.alloc(0)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function feedbackBody(overrides = {}) {
  return {
    id: randomUUID(),
    type: "bug",
    description: "点开氢元素后卡片没有显示出来。",
    page: {
      url: "https://periodic.test/table?student=private#/element/1/atom",
      title: "元素周期表",
      learningMode: "junior",
      viewport: { width: 390, height: 844 },
      userAgent: "Test Browser/1.0",
      version: "1.0.0",
    },
    consent: true,
    website: "",
    ...overrides,
  };
}

function createFakeGitHub({
  createIssueMode,
  uploadMode,
  lookupMode = "normal",
  issueRejectionStatus,
} = {}) {
  const issues = [];
  const files = new Map();
  const calls = [];
  let issueNumber = 0;
  let issueCreateCount = 0;
  let uploadCount = 0;
  let repoReadCount = 0;
  let failAll = false;
  let privateRepo = false;
  let activeLookupMode = lookupMode;
  let shouldTimeoutCreate = createIssueMode === "store_then_timeout";
  let shouldTimeoutUpload = uploadMode === "store_then_timeout";
  let nextIssueRejectionStatus = issueRejectionStatus;

  const fetchImpl = async (input, init = {}) => {
    const url = new URL(input);
    calls.push({
      url: url.toString(),
      method: init.method || "GET",
      token: new Headers(init.headers).get("Authorization"),
    });
    if (failAll) throw new Error(`upstream ${TOKEN}`);
    if (new Headers(init.headers).get("Authorization") !== `Bearer ${TOKEN}`) {
      return jsonResponse({ message: "invalid token" }, 401);
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/repos/acme/periodic-feedback") {
      repoReadCount += 1;
      return jsonResponse({
        private: privateRepo,
        archived: false,
        default_branch: "main",
      });
    }
    if (url.pathname === "/search/issues") {
      if (activeLookupMode === "fail")
        return jsonResponse({ message: "temporarily unavailable" }, 503);
      if (activeLookupMode === "empty") return jsonResponse({ items: [] });
      const marker = /feedback-id:([0-9a-f-]{36})/i.exec(
        url.searchParams.get("q") || "",
      )?.[0];
      return jsonResponse({
        items: issues.filter((issue) => !marker || issue.body.includes(marker)),
      });
    }
    if (
      url.pathname === "/repos/acme/periodic-feedback/issues" &&
      (init.method || "GET") === "GET"
    ) {
      if (activeLookupMode === "fail")
        return jsonResponse({ message: "temporarily unavailable" }, 503);
      if (activeLookupMode === "empty") return jsonResponse([]);
      return jsonResponse(issues);
    }
    if (
      parts[0] === "repos" &&
      parts[1] === "acme" &&
      parts[2] === "periodic-feedback" &&
      parts[3] === "contents"
    ) {
      const filePath = parts.slice(4).join("/");
      if ((init.method || "GET") === "GET") {
        const file = files.get(filePath);
        return file
          ? jsonResponse({ sha: file.sha, download_url: file.download_url })
          : jsonResponse({ message: "Not Found" }, 404);
      }
      if (init.method === "PUT") {
        uploadCount += 1;
        const body = JSON.parse(init.body);
        const bytes = Buffer.from(body.content, "base64");
        const sha = createHash("sha1")
          .update(`blob ${bytes.length}\0`)
          .update(bytes)
          .digest("hex");
        const file = {
          sha,
          download_url: `https://raw.githubusercontent.com/acme/periodic-feedback/main/${filePath}`,
        };
        files.set(filePath, file);
        if (shouldTimeoutUpload) {
          shouldTimeoutUpload = false;
          throw new Error(`network failure ${TOKEN}`);
        }
        return jsonResponse({ content: file });
      }
    }
    if (
      url.pathname === "/repos/acme/periodic-feedback/issues" &&
      init.method === "POST"
    ) {
      issueCreateCount += 1;
      if (nextIssueRejectionStatus) {
        const status = nextIssueRejectionStatus;
        nextIssueRejectionStatus = null;
        return jsonResponse({ message: "rejected" }, status);
      }
      const body = JSON.parse(init.body);
      issueNumber += 1;
      const marker = /<!-- feedback-id:[0-9a-f-]{36} -->/.exec(body.body)?.[0];
      const issue = {
        number: issueNumber,
        title: body.title,
        body: body.body,
        html_url: `https://github.com/acme/periodic-feedback/issues/${issueNumber}`,
      };
      issues.push(issue);
      if (shouldTimeoutCreate) {
        shouldTimeoutCreate = false;
        throw new Error(`timeout after create ${marker} ${TOKEN}`);
      }
      return jsonResponse(issue, 201);
    }
    return jsonResponse({ message: "unexpected route" }, 404);
  };

  return {
    fetchImpl,
    calls,
    issues,
    files,
    get issueCreateCount() {
      return issueCreateCount;
    },
    get uploadCount() {
      return uploadCount;
    },
    get repoReadCount() {
      return repoReadCount;
    },
    failAll() {
      failAll = true;
    },
    setRepositoryPrivate(value) {
      privateRepo = value;
    },
    setLookupMode(value) {
      activeLookupMode = value;
    },
    getIssueCreateCount() {
      return issueCreateCount;
    },
  };
}

async function withServer(
  t,
  { fake = createFakeGitHub(), env, now, requestTimeoutMs } = {},
) {
  const dataDir = await mkdtemp(
    path.join(os.tmpdir(), "periodic-feedback-test-"),
  );
  const server = await createFeedbackServer({
    env: env ?? {
      FEEDBACK_GITHUB_OWNER: "acme",
      FEEDBACK_GITHUB_REPO: "periodic-feedback",
      FEEDBACK_GITHUB_TOKEN: TOKEN,
      FEEDBACK_ALLOWED_ORIGINS: ORIGIN,
    },
    fetchImpl: fake.fetchImpl,
    now,
    dataDir,
    requestTimeoutMs,
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  t.after(async () => {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await server.releaseFeedbackLock();
    await rm(dataDir, { recursive: true, force: true });
  });
  return { baseUrl, dataDir, server, fake };
}

async function post(baseUrl, body, origin = ORIGIN, extraHeaders = {}) {
  return fetch(`${baseUrl}/api/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

test("receiver starts from direct and symlinked entry paths", async (t) => {
  const linkedEntry = await makeServerDirectoryAlias(
    t,
    "periodic-feedback-server-link-test-",
  );

  for (const script of [SERVER_ENTRY, linkedEntry]) {
    const service = await startFeedbackProcess(script, t);
    try {
      const response = await fetch(
        `http://127.0.0.1:${service.port}/api/feedback/health`,
      );
      assert.equal(response.status, 200);
      const health = await response.json();
      assert.equal(health.configured, false);
      assert.equal(health.ready, false);
    } finally {
      await service.stop();
    }
  }
});

test("health is honest when GitHub credentials and origin configuration are absent", async (t) => {
  let upstreamCalls = 0;
  const { baseUrl } = await withServer(t, {
    env: {},
    fake: {
      fetchImpl: async () => {
        upstreamCalls += 1;
        throw new Error(TOKEN);
      },
    },
  });

  const health = await fetch(`${baseUrl}/api/feedback/health`).then(
    (response) => response.json(),
  );
  assert.equal(health.configured, false);
  assert.equal(health.ready, false);
  assert.equal(upstreamCalls, 0);

  const response = await post(baseUrl, feedbackBody());
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /尚未配置/);
});

test("retries a transient public-repository metadata failure after a short cooldown", async (t) => {
  let currentTime = Date.now();
  let calls = 0;
  const fake = {
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new Error("temporary network failure");
      return jsonResponse({
        private: false,
        archived: false,
        default_branch: "main",
      });
    },
  };
  const { baseUrl } = await withServer(t, { fake, now: () => currentTime });

  const failed = await fetch(`${baseUrl}/api/feedback/health`).then(
    (response) => response.json(),
  );
  assert.equal(failed.ready, false);
  assert.equal(calls, 1);
  currentTime += 10_001;

  const recovered = await fetch(`${baseUrl}/api/feedback/health`).then(
    (response) => response.json(),
  );
  assert.equal(recovered.ready, true);
  assert.equal(calls, 2);
});

test("refuses to submit when the configured feedback repository is private", async (t) => {
  let writeCalls = 0;
  const fake = {
    fetchImpl: async (input, init = {}) => {
      if (new URL(input).pathname === "/repos/acme/periodic-feedback") {
        return jsonResponse({
          private: true,
          archived: false,
          default_branch: "main",
        });
      }
      writeCalls += 1;
      return jsonResponse({}, 500);
    },
  };
  const { baseUrl } = await withServer(t, { fake });

  const health = await fetch(`${baseUrl}/api/feedback/health`).then(
    (response) => response.json(),
  );
  assert.equal(health.configured, true);
  assert.equal(health.ready, false);
  assert.equal(health.reason, "repository_not_public_or_archived");
  assert.equal((await post(baseUrl, feedbackBody())).status, 503);
  assert.equal(writeCalls, 0);
});

test("refreshes cached public-repository readiness after 60 seconds", async (t) => {
  let currentTime = Date.now();
  const fake = createFakeGitHub();
  const { baseUrl } = await withServer(t, { fake, now: () => currentTime });

  const initiallyReady = await fetch(`${baseUrl}/api/feedback/health`).then(
    (response) => response.json(),
  );
  assert.equal(initiallyReady.ready, true);
  assert.equal(fake.repoReadCount, 1);

  fake.setRepositoryPrivate(true);
  currentTime += 60_001;
  const noLongerReady = await fetch(`${baseUrl}/api/feedback/health`).then(
    (response) => response.json(),
  );
  assert.equal(noLongerReady.ready, false);
  assert.equal(noLongerReady.reason, "repository_not_public_or_archived");
  assert.equal(fake.repoReadCount, 2);

  const rejected = await post(baseUrl, feedbackBody());
  assert.equal(rejected.status, 503);
  assert.equal(fake.issueCreateCount, 0);
});

test("reclaims a dead-process lock and refuses a second live server for the same journal", async () => {
  const dataDir = await mkdtemp(
    path.join(os.tmpdir(), "periodic-feedback-lock-test-"),
  );
  const lockPath = path.join(dataDir, ".feedback-server.lock");
  await writeFile(
    lockPath,
    JSON.stringify({
      pid: 2_147_483_647,
      startedAt: "2000-01-01T00:00:00.000Z",
    }),
  );
  const fake = createFakeGitHub();
  const env = {
    FEEDBACK_GITHUB_OWNER: "acme",
    FEEDBACK_GITHUB_REPO: "periodic-feedback",
    FEEDBACK_GITHUB_TOKEN: TOKEN,
    FEEDBACK_ALLOWED_ORIGINS: ORIGIN,
  };
  const server = await createFeedbackServer({
    env,
    fetchImpl: fake.fetchImpl,
    dataDir,
  });
  try {
    const lock = JSON.parse(await readFile(lockPath, "utf8"));
    assert.equal(lock.pid, process.pid);
    await assert.rejects(
      () => createFeedbackServer({ env, fetchImpl: fake.fetchImpl, dataDir }),
      /already locked/,
    );
  } finally {
    await server.releaseFeedbackLock();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("consent, exact origin, JSON limit, and malformed screenshot are rejected", async (t) => {
  const { baseUrl, fake } = await withServer(t);

  assert.equal(
    (await post(baseUrl, feedbackBody({ consent: false }))).status,
    400,
  );
  assert.equal(
    (await post(baseUrl, feedbackBody(), "https://other.test")).status,
    403,
  );

  const invalidPng = `data:image/png;base64,${Buffer.from("not png").toString("base64")}`;
  const invalidImage = await post(
    baseUrl,
    feedbackBody({ screenshot: invalidPng }),
  );
  assert.equal(invalidImage.status, 400);

  const oversizedImageData = Buffer.alloc(2 * 1024 * 1024 + 1).toString(
    "base64",
  );
  const oversizedImage = await post(
    baseUrl,
    feedbackBody({ screenshot: `data:image/png;base64,${oversizedImageData}` }),
  );
  assert.equal(oversizedImage.status, 400);

  const oversized = await post(baseUrl, {
    ...feedbackBody(),
    description: "x".repeat(3 * 1024 * 1024),
  });
  assert.equal(oversized.status, 413);
  assert.equal(fake.issueCreateCount, 0);
});

test("creates an issue with a validated screenshot and returns the real GitHub URL", async (t) => {
  const fake = createFakeGitHub();
  const { baseUrl, dataDir } = await withServer(t, { fake });
  const id = randomUUID();
  const screenshot = `data:image/png;base64,${makePng().toString("base64")}`;
  const body = feedbackBody({ id, type: "content", screenshot });

  const healthResponse = await fetch(`${baseUrl}/api/feedback/health`);
  assert.equal(healthResponse.status, 200);
  const health = await healthResponse.json();
  assert.equal(health.configured, true);
  assert.equal(health.ready, true);

  const response = await post(baseUrl, body);
  const result = await response.json();
  assert.equal(response.status, 201);
  assert.equal(result.id, id);
  assert.equal(result.number, 1);
  assert.equal(
    result.url,
    "https://github.com/acme/periodic-feedback/issues/1",
  );
  assert.equal(fake.issueCreateCount, 1);
  assert.equal(fake.uploadCount, 1);
  assert.match(
    fake.issues[0].body,
    /raw\.githubusercontent\.com\/acme\/periodic-feedback\/main\/screenshots\//,
  );
  assert.match(fake.issues[0].body, /feedback-id:/);
  assert.match(fake.issues[0].body, /periodic\.test\/table#\/element\/1\/atom/);
  assert.doesNotMatch(fake.issues[0].body, /student=private/);
  assert.equal(fake.repoReadCount, 1);

  const journal = await readFile(
    path.join(dataDir, "reports", `${id}.json`),
    "utf8",
  );
  assert.match(journal, /"state":"complete"/);
  assert.doesNotMatch(journal, new RegExp(TOKEN));
  assert.equal(
    fake.calls.some((call) => call.token === `Bearer ${TOKEN}`),
    true,
  );
});

test("same id and same payload is idempotent while changed payload conflicts", async (t) => {
  const fake = createFakeGitHub();
  const { baseUrl } = await withServer(t, { fake });
  const body = feedbackBody({ id: randomUUID() });

  const first = await post(baseUrl, body);
  const second = await post(baseUrl, body);
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), await first.json());
  assert.equal(fake.issueCreateCount, 1);

  const changed = await post(baseUrl, {
    ...body,
    description: "另一段不同的反馈内容。",
  });
  assert.equal(changed.status, 409);
  assert.equal(fake.issueCreateCount, 1);
});

test("completed screenshot submissions stay idempotent after journal reload and restart", async (t) => {
  const fake = createFakeGitHub();
  const dataDir = await mkdtemp(
    path.join(os.tmpdir(), "periodic-feedback-completed-replay-test-"),
  );
  const env = {
    FEEDBACK_GITHUB_OWNER: "acme",
    FEEDBACK_GITHUB_REPO: "periodic-feedback",
    FEEDBACK_GITHUB_TOKEN: TOKEN,
    FEEDBACK_ALLOWED_ORIGINS: ORIGIN,
  };
  const launch = async () => {
    const server = await createFeedbackServer({
      env,
      fetchImpl: fake.fetchImpl,
      dataDir,
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
  };

  let running = await launch();
  const id = randomUUID();
  const body = feedbackBody({
    id,
    screenshot: `data:image/png;base64,${makePng().toString("base64")}`,
  });

  try {
    const first = await post(running.baseUrl, body);
    const firstResult = await first.json();
    assert.equal(first.status, 201);
    assert.equal(fake.issueCreateCount, 1);
    assert.equal(fake.uploadCount, 1);
    assert.equal(fake.issues.length, 1);

    const persisted = JSON.parse(
      await readFile(path.join(dataDir, "reports", `${id}.json`), "utf8"),
    );
    assert.equal(persisted.state, "complete");
    assert.equal(persisted.issue.number, firstResult.number);

    await new Promise((resolve) => running.server.close(resolve));
    await running.server.releaseFeedbackLock();
    running = await launch();

    // Pass the exact JSON round-tripped request body through a fresh process-like
    // server instance so the test exercises the persisted record, not references.
    const replayBody = JSON.parse(JSON.stringify(body));
    const replay = await post(running.baseUrl, replayBody);
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), firstResult);
    assert.equal(fake.issueCreateCount, 1);
    assert.equal(fake.uploadCount, 1);
    assert.equal(fake.issues.length, 1);
  } finally {
    if (running.server.listening)
      await new Promise((resolve) => running.server.close(resolve));
    await running.server.releaseFeedbackLock();
    await rm(dataDir, { recursive: true, force: true });
  }
});

test("a completed record without a valid issue reference never falls back to create", async (t) => {
  const fake = createFakeGitHub();
  const { baseUrl, dataDir } = await withServer(t, { fake });
  const id = randomUUID();
  const body = feedbackBody({
    id,
    screenshot: `data:image/png;base64,${makePng().toString("base64")}`,
  });

  const first = await post(baseUrl, body);
  assert.equal(first.status, 201);
  assert.equal(fake.issueCreateCount, 1);
  assert.equal(fake.uploadCount, 1);

  const journalPath = path.join(dataDir, "reports", `${id}.json`);
  const record = JSON.parse(await readFile(journalPath, "utf8"));
  record.issue = null;
  await writeFile(journalPath, `${JSON.stringify(record)}\n`, "utf8");

  const replay = await post(baseUrl, JSON.parse(JSON.stringify(body)));
  const result = await replay.json();
  assert.equal(replay.status, 503);
  assert.equal(result.error, "feedback_processing");
  assert.equal(fake.issueCreateCount, 1);
  assert.equal(fake.uploadCount, 1);
  assert.equal(fake.issues.length, 1);
});

test("recovers an issue created before an ambiguous network failure after a server restart", async (t) => {
  let currentTime = Date.now();
  const fake = createFakeGitHub({ createIssueMode: "store_then_timeout" });
  const dataDir = await mkdtemp(
    path.join(os.tmpdir(), "periodic-feedback-restart-test-"),
  );
  const env = {
    FEEDBACK_GITHUB_OWNER: "acme",
    FEEDBACK_GITHUB_REPO: "periodic-feedback",
    FEEDBACK_GITHUB_TOKEN: TOKEN,
    FEEDBACK_ALLOWED_ORIGINS: ORIGIN,
  };
  const launch = async () => {
    const server = await createFeedbackServer({
      env,
      fetchImpl: fake.fetchImpl,
      now: () => currentTime,
      dataDir,
    });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
  };

  let running = await launch();
  const body = feedbackBody({ id: randomUUID() });

  try {
    const first = await post(running.baseUrl, body);
    assert.equal(first.status, 503);
    const firstResult = await first.json();
    assert.equal(firstResult.error, "feedback_processing");
    assert.match(firstResult.message, new RegExp(body.id));
    assert.match(firstResult.message, /重试只会查询结果/);
    assert.equal(fake.issueCreateCount, 1);
    await new Promise((resolve) => running.server.close(resolve));
    await running.server.releaseFeedbackLock();
    currentTime += 1_000;

    running = await launch();
    const retry = await post(running.baseUrl, body);
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).number, 1);
    assert.equal(fake.issueCreateCount, 1);
  } finally {
    if (running.server.listening)
      await new Promise((resolve) => running.server.close(resolve));
    await running.server.releaseFeedbackLock();
    await rm(dataDir, { recursive: true, force: true });
  }
});

for (const lookupMode of ["fail", "empty"]) {
  test(`does not create a second issue after an ambiguous POST when reconciliation is ${lookupMode}`, async (t) => {
    let currentTime = Date.now();
    const fake = createFakeGitHub({ createIssueMode: "store_then_timeout" });
    const { baseUrl } = await withServer(t, { fake, now: () => currentTime });
    const body = feedbackBody({ id: randomUUID() });

    const first = await post(baseUrl, body);
    assert.equal(first.status, 503);
    const firstResult = await first.json();
    assert.equal(firstResult.error, "feedback_processing");
    assert.match(firstResult.message, new RegExp(body.id));
    assert.equal(fake.issueCreateCount, 1);

    fake.setLookupMode(lookupMode);
    currentTime += 31_000;
    const retry = await post(baseUrl, body);
    const result = await retry.json();
    assert.equal(retry.status, 503);
    assert.equal(result.error, "feedback_processing");
    assert.equal(fake.issueCreateCount, 1);
    assert.equal(fake.issues.length, 1);
  });
}

test("retries a definitive GitHub rejection without creating a duplicate issue", async (t) => {
  const fake = createFakeGitHub({ issueRejectionStatus: 429 });
  const { baseUrl, dataDir } = await withServer(t, { fake });
  const body = feedbackBody({ id: randomUUID() });

  const rejected = await post(baseUrl, body);
  const rejectedResult = await rejected.json();
  assert.equal(rejected.status, 503);
  assert.equal(rejectedResult.error, "github_unavailable");
  assert.equal(fake.issueCreateCount, 1);

  const journal = JSON.parse(
    await readFile(path.join(dataDir, "reports", `${body.id}.json`), "utf8"),
  );
  assert.equal(journal.state, "received");
  assert.equal(journal.issueCreateStartedAt, null);

  const retry = await post(baseUrl, body);
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).id, body.id);
  assert.equal(fake.issueCreateCount, 2);
  assert.equal(fake.issues.length, 1);
});

test("feedback admin runs through a symlink, lists pending ids, and only reopens after explicit confirmation while stopped", async (t) => {
  const dataDir = await mkdtemp(
    path.join(os.tmpdir(), "periodic-feedback-admin-test-"),
  );
  const reportsDir = path.join(dataDir, "reports");
  await mkdir(reportsDir, { recursive: true });
  const pendingId = randomUUID();
  const pending = {
    id: pendingId,
    fingerprint: "stable-fingerprint",
    state: "issue_create_started",
    issueCreateStartedAt: "2026-10-18T00:00:00.000Z",
    screenshotUrl:
      "https://raw.githubusercontent.com/acme/periodic-feedback/main/screenshots/example.png",
    description: "private description must not be listed",
  };
  await writeFile(
    path.join(reportsDir, `${pendingId}.json`),
    JSON.stringify(pending),
  );
  const completedId = randomUUID();
  await writeFile(
    path.join(reportsDir, `${completedId}.json`),
    JSON.stringify({ ...pending, id: completedId, state: "complete" }),
  );

  const script = await makeServerDirectoryAlias(
    t,
    "periodic-feedback-admin-link-test-",
    "feedback-admin.mjs",
  );
  const env = { ...process.env, FEEDBACK_DATA_DIR: dataDir };
  const runAdmin = (...args) =>
    spawnSync(process.execPath, [script, ...args], { env, encoding: "utf8" });
  t.after(() => rm(dataDir, { recursive: true, force: true }));

  const listing = runAdmin("list-pending");
  assert.equal(listing.status, 0, listing.stderr);
  assert.deepEqual(JSON.parse(listing.stdout), { pendingIds: [pendingId] });
  assert.doesNotMatch(listing.stdout, /private description|stable-fingerprint/);

  const missingConfirmation = runAdmin("retry-confirmed-absent", pendingId);
  assert.notEqual(missingConfirmation.status, 0);
  assert.match(missingConfirmation.stderr, /--confirmed-absent/);
  assert.equal(
    JSON.parse(
      await readFile(path.join(reportsDir, `${pendingId}.json`), "utf8"),
    ).state,
    "issue_create_started",
  );

  await writeFile(
    path.join(dataDir, ".feedback-server.lock"),
    JSON.stringify({ pid: process.pid }),
  );
  const serviceLocked = runAdmin(
    "retry-confirmed-absent",
    pendingId,
    "--confirmed-absent",
  );
  assert.notEqual(serviceLocked.status, 0);
  assert.match(serviceLocked.stderr, /running|lock/i);
  await rm(path.join(dataDir, ".feedback-server.lock"));

  const reopened = runAdmin(
    "retry-confirmed-absent",
    pendingId,
    "--confirmed-absent",
  );
  assert.equal(reopened.status, 0, reopened.stderr);
  assert.deepEqual(JSON.parse(reopened.stdout), { reopened: pendingId });
  const saved = JSON.parse(
    await readFile(path.join(reportsDir, `${pendingId}.json`), "utf8"),
  );
  assert.equal(saved.state, "screenshot_uploaded");
  assert.equal(saved.issueCreateStartedAt, null);
  assert.equal(saved.description, pending.description);
  assert.equal(saved.fingerprint, pending.fingerprint);
});

test("retries a screenshot upload by checking its stable path after an ambiguous timeout", async (t) => {
  const fake = createFakeGitHub({ uploadMode: "store_then_timeout" });
  const { baseUrl } = await withServer(t, { fake });
  const body = feedbackBody({
    id: randomUUID(),
    screenshot: `data:image/png;base64,${makePng().toString("base64")}`,
  });

  const first = await post(baseUrl, body);
  assert.equal(first.status, 502);
  assert.equal(fake.uploadCount, 1);

  const retry = await post(baseUrl, body);
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).number, 1);
  assert.equal(fake.uploadCount, 1);
  assert.equal(fake.issueCreateCount, 1);
});

test("rate limits new reports and never leaks GitHub credentials in failures", async (t) => {
  let currentTime = Date.now();
  const fake = createFakeGitHub();
  const { baseUrl } = await withServer(t, { fake, now: () => currentTime });

  const first = await post(baseUrl, feedbackBody({ id: randomUUID() }));
  assert.equal(first.status, 201);
  const limited = await post(baseUrl, feedbackBody({ id: randomUUID() }));
  assert.equal(limited.status, 429);
  assert.ok((await limited.json()).retryAfter > 0);

  currentTime += 61_000;
  fake.failAll();
  const failed = await post(baseUrl, feedbackBody({ id: randomUUID() }));
  const failedText = await failed.text();
  assert.equal(failed.status, 503);
  assert.doesNotMatch(failedText, new RegExp(TOKEN));
});

test("uses forwarded client IPs only behind an explicitly trusted proxy", async (t) => {
  const trustedEnv = {
    FEEDBACK_GITHUB_OWNER: "acme",
    FEEDBACK_GITHUB_REPO: "periodic-feedback",
    FEEDBACK_GITHUB_TOKEN: TOKEN,
    FEEDBACK_ALLOWED_ORIGINS: ORIGIN,
    FEEDBACK_TRUSTED_PROXY_ADDRESSES: "127.0.0.1",
  };
  const trusted = await withServer(t, {
    env: trustedEnv,
    fake: createFakeGitHub(),
  });
  assert.equal(
    (
      await post(trusted.baseUrl, feedbackBody({ id: randomUUID() }), ORIGIN, {
        "X-Forwarded-For": "192.0.2.10",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await post(trusted.baseUrl, feedbackBody({ id: randomUUID() }), ORIGIN, {
        "X-Forwarded-For": "192.0.2.10",
      })
    ).status,
    429,
  );
  assert.equal(
    (
      await post(trusted.baseUrl, feedbackBody({ id: randomUUID() }), ORIGIN, {
        "X-Forwarded-For": "192.0.2.11",
      })
    ).status,
    201,
  );

  const untrusted = await withServer(t, { fake: createFakeGitHub() });
  assert.equal(
    (
      await post(
        untrusted.baseUrl,
        feedbackBody({ id: randomUUID() }),
        ORIGIN,
        { "X-Forwarded-For": "192.0.2.20" },
      )
    ).status,
    201,
  );
  assert.equal(
    (
      await post(
        untrusted.baseUrl,
        feedbackBody({ id: randomUUID() }),
        ORIGIN,
        { "X-Forwarded-For": "192.0.2.21" },
      )
    ).status,
    429,
  );
});
