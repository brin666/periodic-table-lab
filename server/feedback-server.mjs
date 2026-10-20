import { createHash, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { realpathSync } from "node:fs";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { isIP } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BODY_BYTES = 3 * 1024 * 1024;
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 3000;
const GLOBAL_DAILY_LIMIT = 100;
const IP_COOLDOWN_MS = 60_000;
const PUBLIC_REPO_CACHE_MS = 60_000;
const GITHUB_API = "https://api.github.com";
const ISSUE_MARKER_PREFIX = "feedback-id:";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TYPE_LABELS = {
  bug: "问题反馈",
  content: "内容纠错",
  suggestion: "改进建议",
};

function isMainModule() {
  const entryPoint = process.argv[1];
  if (!entryPoint) return false;
  try {
    return (
      realpathSync(entryPoint) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

class HttpError extends Error {
  constructor(status, error, message, retryAfter) {
    super(message);
    this.status = status;
    this.error = error;
    this.retryAfter = retryAfter;
  }
}

function pendingIssueError(id) {
  return new HttpError(
    503,
    "feedback_processing",
    `提交结果待核实，请保留反馈编号 ${id}。重试只会查询结果，不会重复提交；请维护者核对。`,
    60,
  );
}

function safeText(value, maxLength) {
  return [
    ...value
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
      .trim(),
  ]
    .slice(0, maxLength)
    .join("");
}

function oneLineText(value, maxLength) {
  return safeText(value.replace(/\s+/g, " "), maxLength);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseOrigins(value) {
  if (!value) return new Set();
  const origins = new Set();
  for (const item of value.split(",")) {
    const origin = item.trim();
    if (!origin) continue;
    try {
      const parsed = new URL(origin);
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        parsed.origin === origin &&
        parsed.username === "" &&
        parsed.password === ""
      ) {
        origins.add(origin);
      }
    } catch {
      // Ignore malformed entries. An invalid origin cannot grant browser access.
    }
  }
  return origins;
}

function readConfig(env, dataDirOverride) {
  const owner = env.FEEDBACK_GITHUB_OWNER?.trim() ?? "";
  const repo = env.FEEDBACK_GITHUB_REPO?.trim() ?? "";
  const token = env.FEEDBACK_GITHUB_TOKEN?.trim() ?? "";
  const repositoryNameValid =
    /^[A-Za-z0-9_.-]{1,100}$/.test(owner) &&
    /^[A-Za-z0-9_.-]{1,100}$/.test(repo);
  const credentialsConfigured = repositoryNameValid && token.length > 0;
  const allowedOrigins = parseOrigins(env.FEEDBACK_ALLOWED_ORIGINS ?? "");
  const trustedProxyAddresses = new Set(
    (env.FEEDBACK_TRUSTED_PROXY_ADDRESSES ?? "")
      .split(",")
      .map((address) => address.trim())
      .filter((address) => isIP(address) > 0),
  );
  const dataDir = path.resolve(
    dataDirOverride ??
      env.FEEDBACK_DATA_DIR ??
      path.join(os.homedir(), ".periodic-table-lab-feedback"),
  );

  return {
    owner,
    repo,
    token,
    allowedOrigins,
    trustedProxyAddresses,
    credentialsConfigured,
    configured: credentialsConfigured && allowedOrigins.size > 0,
    dataDir,
  };
}

function isProcessAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH" && error?.code !== "EINVAL";
  }
}

async function createLockFile(lockPath, now) {
  const handle = await open(lockPath, "wx", 0o600);
  try {
    await handle.writeFile(
      `${JSON.stringify({ pid: process.pid, startedAt: new Date(now()).toISOString() })}\n`,
    );
    await handle.sync();
    return handle;
  } catch (error) {
    await handle.close().catch(() => {});
    await unlink(lockPath).catch(() => {});
    throw error;
  }
}

async function acquireServerLock(lockPath, now) {
  try {
    return await createLockFile(lockPath, now);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
  }

  let staleLock;
  try {
    staleLock = await readJson(lockPath, null);
  } catch {
    throw new Error(
      `Feedback data directory has an unreadable lock: ${path.dirname(lockPath)}`,
    );
  }
  if (!isObject(staleLock) || !Number.isSafeInteger(staleLock.pid)) {
    throw new Error(
      `Feedback data directory has an invalid lock: ${path.dirname(lockPath)}`,
    );
  }
  if (isProcessAlive(staleLock.pid)) {
    throw new Error(
      `Feedback data directory is already locked: ${path.dirname(lockPath)}`,
    );
  }

  // Serialize stale-lock cleanup so two starters cannot remove one another's
  // newly acquired lock after observing the same dead owner.
  const reclaimPath = `${lockPath}.reclaim`;
  let reclaimHandle;
  try {
    reclaimHandle = await createLockFile(reclaimPath, now);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(
        `Feedback data directory lock recovery is in progress: ${path.dirname(lockPath)}`,
      );
    }
    throw error;
  }
  try {
    const currentLock = await readJson(lockPath, null);
    if (
      !isObject(currentLock) ||
      currentLock.pid !== staleLock.pid ||
      isProcessAlive(currentLock.pid)
    ) {
      throw new Error(
        `Feedback data directory is already locked: ${path.dirname(lockPath)}`,
      );
    }
    await unlink(lockPath);
    return await createLockFile(lockPath, now);
  } finally {
    await reclaimHandle.close().catch(() => {});
    await unlink(reclaimPath).catch(() => {});
  }
}

async function atomicWriteJson(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  const data = `${JSON.stringify(value)}\n`;
  let handle;
  try {
    handle = await open(tempPath, "wx", 0o600);
    await handle.writeFile(data, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempPath, filePath);
    let directory;
    try {
      directory = await open(path.dirname(filePath), "r");
      await directory.sync();
    } catch {
      // Some platforms do not allow syncing directories; file data is already synced.
    } finally {
      await directory?.close().catch(() => {});
    }
  } finally {
    await handle?.close().catch(() => {});
    await unlink(tempPath).catch(() => {});
  }
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

async function readBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      throw new HttpError(
        413,
        "payload_too_large",
        "提交内容过大，请缩小截图后重试。",
      );
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, total);
}

function checkDimensions(width, height) {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 16_384 ||
    height > 16_384 ||
    width * height > 100_000_000
  ) {
    throw new HttpError(
      400,
      "invalid_screenshot",
      "截图格式无效，请重新截取后再提交。",
    );
  }
}

function inspectPng(bytes) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 45 || !bytes.subarray(0, 8).equals(signature))
    return false;

  let offset = 8;
  let sawHeader = false;
  let sawEnd = false;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const end = offset + 12 + length;
    if (end > bytes.length) return false;
    if (!sawHeader) {
      if (type !== "IHDR" || length !== 13) return false;
      checkDimensions(
        bytes.readUInt32BE(offset + 8),
        bytes.readUInt32BE(offset + 12),
      );
      sawHeader = true;
    }
    if (type === "IEND") {
      if (length !== 0 || end !== bytes.length) return false;
      sawEnd = true;
      break;
    }
    offset = end;
  }
  return sawHeader && sawEnd;
}

function inspectJpeg(bytes) {
  if (
    bytes.length < 12 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    return false;
  }

  const frameMarkers = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce,
    0xcf,
  ]);
  let offset = 2;
  let sawFrame = false;
  let sawScan = false;

  while (offset < bytes.length - 2) {
    if (bytes[offset] !== 0xff) return false;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return false;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) return false;
    const segmentLength = bytes.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > bytes.length)
      return false;

    if (frameMarkers.has(marker)) {
      if (segmentLength < 8) return false;
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      checkDimensions(width, height);
      sawFrame = true;
    }
    offset += segmentLength;
    if (marker === 0xda) {
      sawScan = true;
      break;
    }
  }
  return sawFrame && sawScan;
}

function parseScreenshot(value) {
  if (value === undefined) return null;
  if (typeof value !== "string") {
    throw new HttpError(
      400,
      "invalid_screenshot",
      "截图格式无效，请重新截取后再提交。",
    );
  }
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
    value,
  );
  if (!match)
    throw new HttpError(
      400,
      "invalid_screenshot",
      "仅支持 PNG 或 JPEG 格式的截图。",
    );
  const encoded = match[2];
  const bytes = Buffer.from(encoded, "base64");
  if (
    bytes.length === 0 ||
    bytes.length > MAX_SCREENSHOT_BYTES ||
    bytes.toString("base64") !== encoded
  ) {
    throw new HttpError(
      400,
      "invalid_screenshot",
      "截图超过 2 MB 或编码无效，请缩小后重试。",
    );
  }
  const valid = match[1] === "png" ? inspectPng(bytes) : inspectJpeg(bytes);
  if (!valid)
    throw new HttpError(
      400,
      "invalid_screenshot",
      "截图文件损坏或内容与文件类型不符。",
    );
  return {
    mime: match[1] === "png" ? "image/png" : "image/jpeg",
    extension: match[1] === "png" ? "png" : "jpg",
    base64: encoded,
    blobSha: gitBlobSha(bytes),
  };
}

function gitBlobSha(bytes) {
  return createHash("sha1")
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest("hex");
}

function validateSubmission(body) {
  if (!isObject(body))
    throw new HttpError(400, "invalid_request", "提交内容格式无效。");
  if (typeof body.website !== "string" || body.website !== "") {
    throw new HttpError(400, "invalid_request", "提交内容格式无效。");
  }
  if (!UUID_PATTERN.test(body.id ?? ""))
    throw new HttpError(
      400,
      "invalid_request",
      "反馈编号无效，请刷新页面后重试。",
    );
  if (!Object.hasOwn(TYPE_LABELS, body.type))
    throw new HttpError(400, "invalid_request", "请选择有效的反馈类型。");
  if (body.consent !== true)
    throw new HttpError(
      400,
      "consent_required",
      "请先确认允许将反馈公开到项目反馈库。",
    );

  if (typeof body.description !== "string")
    throw new HttpError(400, "invalid_request", "请填写反馈内容。");
  const description = body.description
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim();
  const descriptionLength = [...description].length;
  if (descriptionLength < 10 || descriptionLength > MAX_DESCRIPTION_LENGTH) {
    throw new HttpError(
      400,
      "invalid_request",
      "反馈内容请填写 10 到 3000 个字符。",
    );
  }

  if (!isObject(body.page) || !isObject(body.page.viewport)) {
    throw new HttpError(
      400,
      "invalid_request",
      "页面诊断信息无效，请刷新页面后重试。",
    );
  }
  const { page } = body;
  if (page.learningMode !== "junior" && page.learningMode !== "senior") {
    throw new HttpError(
      400,
      "invalid_request",
      "页面诊断信息无效，请刷新页面后重试。",
    );
  }
  const { width, height } = page.viewport;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 10_000 ||
    height > 10_000
  ) {
    throw new HttpError(
      400,
      "invalid_request",
      "页面诊断信息无效，请刷新页面后重试。",
    );
  }
  if (
    typeof page.url !== "string" ||
    page.url.length > 4096 ||
    typeof page.title !== "string" ||
    typeof page.userAgent !== "string" ||
    typeof page.version !== "string"
  ) {
    throw new HttpError(
      400,
      "invalid_request",
      "页面诊断信息无效，请刷新页面后重试。",
    );
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(page.url);
  } catch {
    throw new HttpError(
      400,
      "invalid_request",
      "页面诊断信息无效，请刷新页面后重试。",
    );
  }
  if (
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
    parsedUrl.pathname.length > 1024
  ) {
    throw new HttpError(
      400,
      "invalid_request",
      "页面诊断信息无效，请刷新页面后重试。",
    );
  }

  const canonicalHash =
    /^#(?:\/|\/element\/[A-Za-z0-9_-]{1,80}(?:\/(?:atom|substance\/[A-Za-z0-9_-]{1,80}))?)$/.test(
      parsedUrl.hash,
    )
      ? parsedUrl.hash
      : "";
  const screenshot = parseScreenshot(body.screenshot);
  const normalized = {
    id: body.id.toLowerCase(),
    type: body.type,
    description,
    page: {
      url: `${parsedUrl.origin}${parsedUrl.pathname}${canonicalHash}`,
      title: typeof page.title === "string" ? oneLineText(page.title, 200) : "",
      learningMode: page.learningMode,
      viewport: { width, height },
      userAgent:
        typeof page.userAgent === "string"
          ? oneLineText(page.userAgent, 300)
          : "",
      version:
        typeof page.version === "string" ? oneLineText(page.version, 100) : "",
    },
    screenshot,
  };
  normalized.fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        ...normalized,
        screenshot: screenshot
          ? { mime: screenshot.mime, blobSha: screenshot.blobSha }
          : null,
      }),
    )
    .digest("hex");
  return normalized;
}

function requestJson(response, status, data, origin) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(JSON.stringify(data));
}

function getClientKey(request, trustedProxyAddresses) {
  const remoteAddress = request.socket?.remoteAddress || "unknown";
  let clientAddress = remoteAddress;
  const forwardedAddress = request.headers["x-forwarded-for"];
  if (
    trustedProxyAddresses.has(remoteAddress) &&
    typeof forwardedAddress === "string"
  ) {
    const candidate = forwardedAddress.trim();
    if (!candidate.includes(",") && isIP(candidate) > 0)
      clientAddress = candidate;
  }
  return createHash("sha256").update(clientAddress).digest("hex");
}

export async function createFeedbackServer({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  dataDir,
  requestTimeoutMs = 15_000,
} = {}) {
  if (typeof fetchImpl !== "function")
    throw new Error("Fetch is unavailable in this Node.js runtime.");
  const config = readConfig(env, dataDir);
  await mkdir(config.dataDir, { recursive: true, mode: 0o700 });
  const lockPath = path.join(config.dataDir, ".feedback-server.lock");
  const lockHandle = await acquireServerLock(lockPath, now);

  const journalDir = path.join(config.dataDir, "reports");
  try {
    await mkdir(journalDir, { recursive: true, mode: 0o700 });
  } catch (error) {
    await lockHandle.close().catch(() => {});
    await unlink(lockPath).catch(() => {});
    throw error;
  }
  const limitsPath = path.join(config.dataDir, "limits.json");
  let repositoryCheckPromise;
  let repositoryCheckCache;
  let submissionQueue = Promise.resolve();
  let releasePromise;

  const repoPrefix = `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`;

  async function githubRequest(apiPath, { method = "GET", body } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    timeout.unref?.();
    try {
      const result = await fetchImpl(new URL(apiPath, GITHUB_API), {
        method,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${config.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      let data = null;
      try {
        data = await result.json();
      } catch {
        // API error bodies are intentionally not forwarded to callers.
      }
      return { status: result.status, ok: result.ok, data };
    } catch (error) {
      const failure = new Error(
        error?.name === "AbortError" ? "timeout" : "network",
      );
      failure.kind = error?.name === "AbortError" ? "timeout" : "network";
      throw failure;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function ensurePublicRepository() {
    if (!config.configured)
      return { ready: false, reason: "missing_configuration" };
    if (repositoryCheckCache && now() < repositoryCheckCache.expiresAt) {
      return repositoryCheckCache.result;
    }
    if (!repositoryCheckPromise) {
      const check = (async () => {
        try {
          const result = await githubRequest(repoPrefix);
          if (!result.ok)
            return {
              ready: false,
              reason:
                result.status === 401
                  ? "credentials_invalid"
                  : "github_unavailable",
            };
          if (
            result.data?.private !== false ||
            result.data?.archived === true
          ) {
            return {
              ready: false,
              reason: "repository_not_public_or_archived",
            };
          }
          return {
            ready: true,
            defaultBranch: result.data.default_branch || "main",
          };
        } catch {
          return { ready: false, reason: "github_unavailable" };
        }
      })();
      repositoryCheckPromise = check;
      check
        .then((result) => {
          repositoryCheckCache = {
            result,
            expiresAt: now() + (result.ready ? PUBLIC_REPO_CACHE_MS : 10_000),
          };
        })
        .finally(() => {
          if (repositoryCheckPromise === check) repositoryCheckPromise = null;
        });
    }
    return repositoryCheckPromise;
  }

  function issueMarker(id) {
    return `<!-- ${ISSUE_MARKER_PREFIX}${id} -->`;
  }

  async function findExistingIssue(id) {
    const marker = issueMarker(id);
    const query = new URLSearchParams({
      q: `repo:${config.owner}/${config.repo} is:issue "${ISSUE_MARKER_PREFIX}${id}"`,
      per_page: "10",
    });
    const searched = await githubRequest(`/search/issues?${query.toString()}`);
    if (searched.ok && Array.isArray(searched.data?.items)) {
      const match = searched.data.items.find(
        (issue) =>
          !issue.pull_request &&
          typeof issue.body === "string" &&
          issue.body.includes(marker),
      );
      if (match) return match;
    }

    // Search can lag after a successful create. This recent page can recover
    // matches during that window, but an empty result is never proof of absence.
    const recent = await githubRequest(
      `${repoPrefix}/issues?state=all&per_page=100&sort=created&direction=desc`,
    );
    if (recent.ok && Array.isArray(recent.data)) {
      return (
        recent.data.find(
          (issue) =>
            !issue.pull_request &&
            typeof issue.body === "string" &&
            issue.body.includes(marker),
        ) ?? null
      );
    }
    return null;
  }

  function issueReference(issue) {
    const number = issue?.number;
    let url;
    try {
      url = new URL(issue?.html_url);
    } catch {
      return null;
    }
    if (
      !Number.isSafeInteger(number) ||
      number < 1 ||
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.pathname.toLowerCase() !==
        `/${config.owner}/${config.repo}/issues/${number}`.toLowerCase()
    ) {
      return null;
    }
    return { number, url: issue.html_url };
  }

  function apiContentPath(filePath) {
    return `${repoPrefix}/contents/${filePath.split("/").map(encodeURIComponent).join("/")}`;
  }

  function rawImageUrl(branch, filePath) {
    const safeBranch = branch.split("/").map(encodeURIComponent).join("/");
    const safeFile = filePath.split("/").map(encodeURIComponent).join("/");
    return `https://raw.githubusercontent.com/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/${safeBranch}/${safeFile}`;
  }

  async function uploadScreenshot(record, defaultBranch) {
    if (!record.screenshot) return null;
    if (record.screenshotUrl) return record.screenshotUrl;

    const filePath = `screenshots/${record.id}.${record.screenshot.extension}`;
    const expectedSha = record.screenshot.blobSha;
    const existing = await githubRequest(apiContentPath(filePath));
    if (existing.ok) {
      if (existing.data?.sha !== expectedSha) {
        throw new HttpError(
          409,
          "screenshot_conflict",
          "截图上传状态无法确认，请联系项目维护者处理。",
        );
      }
      return existing.data.download_url || rawImageUrl(defaultBranch, filePath);
    }
    if (existing.status !== 404) {
      throw new HttpError(
        502,
        "github_unavailable",
        "反馈暂时无法保存，请稍后重试。",
        15,
      );
    }

    const uploaded = await githubRequest(apiContentPath(filePath), {
      method: "PUT",
      body: {
        message: `Add feedback screenshot ${record.id}`,
        content: record.screenshot.base64,
      },
    });
    if (uploaded.ok) {
      const content = uploaded.data?.content;
      if (content?.sha !== expectedSha) {
        throw new HttpError(
          502,
          "github_unavailable",
          "反馈暂时无法保存，请稍后重试。",
          15,
        );
      }
      return content.download_url || rawImageUrl(defaultBranch, filePath);
    }

    if (uploaded.status === 409 || uploaded.status === 422) {
      const afterConflict = await githubRequest(apiContentPath(filePath));
      if (afterConflict.ok && afterConflict.data?.sha === expectedSha) {
        return (
          afterConflict.data.download_url ||
          rawImageUrl(defaultBranch, filePath)
        );
      }
    }
    throw new HttpError(
      502,
      "github_unavailable",
      "反馈暂时无法保存，请稍后重试。",
      15,
    );
  }

  function markdownText(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/@/g, "＠");
  }

  function makeIssueBody(record, imageUrl) {
    const marker = issueMarker(record.id);
    const description = markdownText(record.description).replace(
      /```/g,
      "` ` `",
    );
    const page = record.page;
    const diagnostics = [
      `- 页面：${markdownText(page.url)}`,
      `- 页面标题：${markdownText(page.title || "（空）")}`,
      `- 学习模式：${page.learningMode}`,
      `- 窗口尺寸：${page.viewport.width} × ${page.viewport.height}`,
      `- 版本：${markdownText(page.version || "（未提供）")}`,
      `- 浏览器：${markdownText(page.userAgent || "（未提供）")}`,
    ].join("\n");
    return [
      marker,
      "## 反馈内容",
      "",
      "```text",
      description,
      "```",
      "",
      imageUrl ? `![用户提交的截图](${imageUrl})` : "",
      imageUrl ? "" : null,
      "## 页面诊断信息",
      "",
      diagnostics,
      "",
      "---",
      "此内容由网站匿名反馈入口提交。",
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  async function enforceRateLimit(clientKey, limits) {
    const nowMs = now();
    const today = new Date(nowMs).toISOString().slice(0, 10);
    if (limits.day !== today) {
      limits.day = today;
      limits.count = 0;
    }
    if (limits.count >= GLOBAL_DAILY_LIMIT) {
      const tomorrow =
        Date.parse(`${today}T00:00:00.000Z`) + 24 * 60 * 60 * 1000;
      const retryAfter = Math.max(1, Math.ceil((tomorrow - nowMs) / 1000));
      throw new HttpError(
        429,
        "rate_limited",
        "今天的反馈数量已达到上限，请明天再试。",
        retryAfter,
      );
    }
    const lastAccepted = limits.clients[clientKey] ?? 0;
    if (nowMs - lastAccepted < IP_COOLDOWN_MS) {
      const retryAfter = Math.max(
        1,
        Math.ceil((IP_COOLDOWN_MS - (nowMs - lastAccepted)) / 1000),
      );
      throw new HttpError(
        429,
        "rate_limited",
        "提交过于频繁，请稍后再试。",
        retryAfter,
      );
    }

    limits.count += 1;
    limits.clients[clientKey] = nowMs;
    for (const [key, timestamp] of Object.entries(limits.clients)) {
      if (nowMs - timestamp > 24 * 60 * 60 * 1000) delete limits.clients[key];
    }
    await atomicWriteJson(limitsPath, limits);
  }

  async function saveRecord(record) {
    await atomicWriteJson(path.join(journalDir, `${record.id}.json`), record);
  }

  async function getRecord(id) {
    return readJson(path.join(journalDir, `${id}.json`), null);
  }

  async function processSubmission(submission, clientKey) {
    const existing = await getRecord(submission.id);
    let record = existing;
    let created = false;
    let issueCreateMayHaveStarted = existing?.state === "issue_create_started";

    if (record && record.fingerprint !== submission.fingerprint) {
      throw new HttpError(
        409,
        "id_conflict",
        "此反馈编号已用于其他内容，请刷新页面后重试。",
      );
    }
    if (record?.state === "complete") {
      const issue = issueReference({
        number: record.issue?.number,
        html_url: record.issue?.url,
      });
      if (!issue) throw pendingIssueError(record.id);
      return {
        status: 200,
        data: { id: record.id, number: issue.number, url: issue.url },
      };
    }
    if (!record) {
      let limits;
      try {
        limits = await readJson(limitsPath, { day: "", count: 0, clients: {} });
        if (
          !isObject(limits) ||
          !isObject(limits.clients) ||
          typeof limits.day !== "string" ||
          !Number.isSafeInteger(limits.count) ||
          limits.count < 0 ||
          Object.values(limits.clients).some(
            (timestamp) => !Number.isFinite(timestamp),
          )
        ) {
          throw new Error("invalid limits state");
        }
        await enforceRateLimit(clientKey, limits);
      } catch (error) {
        if (error instanceof HttpError) throw error;
        throw new HttpError(
          500,
          "storage_unavailable",
          "反馈暂时无法保存，请稍后重试。",
          15,
        );
      }
      const storedAt = new Date(now()).toISOString();
      record = {
        ...submission,
        createdAt: storedAt,
        state: "received",
        screenshotUrl: null,
        issueCreateStartedAt: null,
        issue: null,
      };
      try {
        await saveRecord(record);
      } catch {
        throw new HttpError(
          500,
          "storage_unavailable",
          "反馈暂时无法保存，请稍后重试。",
          15,
        );
      }
      created = true;
    }

    const repository = await ensurePublicRepository();
    if (!repository.ready) {
      throw new HttpError(
        503,
        "feedback_unavailable",
        "匿名反馈服务暂时不可用，请稍后重试。",
        60,
      );
    }

    try {
      if (record.screenshot) {
        const screenshotReadiness = await ensurePublicRepository();
        if (!screenshotReadiness.ready) {
          throw new HttpError(
            503,
            "feedback_unavailable",
            "匿名反馈服务暂时不可用，请稍后重试。",
            60,
          );
        }
        record.screenshotUrl = await uploadScreenshot(
          record,
          screenshotReadiness.defaultBranch,
        );
        if (record.state !== "issue_create_started")
          record.state = "screenshot_uploaded";
        await saveRecord(record);
      }

      if (record.state === "issue_create_started") {
        const recovered = await findExistingIssue(record.id);
        if (recovered) {
          record.issue = issueReference(recovered);
          if (!record.issue) throw pendingIssueError(record.id);
          record.state = "complete";
          await saveRecord(record);
        } else {
          // GitHub search can be eventually consistent and the list is bounded
          // to recent issues. Absence from either response is inconclusive, so
          // keep the write-ahead state and never issue a second POST.
          throw pendingIssueError(record.id);
        }
      }

      if (record.state !== "complete") {
        if (
          record.state !== "received" &&
          record.state !== "screenshot_uploaded"
        ) {
          throw pendingIssueError(record.id);
        }
        const createReadiness = await ensurePublicRepository();
        if (!createReadiness.ready) {
          throw new HttpError(
            503,
            "feedback_unavailable",
            "匿名反馈服务暂时不可用，请稍后重试。",
            60,
          );
        }
        record.state = "issue_create_started";
        record.issueCreateStartedAt = new Date(now()).toISOString();
        await saveRecord(record);
        issueCreateMayHaveStarted = true;
        let createdIssue;
        try {
          createdIssue = await githubRequest(`${repoPrefix}/issues`, {
            method: "POST",
            body: {
              title: `[${TYPE_LABELS[record.type]}] ${markdownText(record.description.replace(/\s+/g, " ")).slice(0, 90)}`,
              body: makeIssueBody(record, record.screenshotUrl),
            },
          });
        } catch {
          throw pendingIssueError(record.id);
        }

        if (!createdIssue.ok) {
          if (createdIssue.status >= 500) {
            throw pendingIssueError(record.id);
          }
          record.state = record.screenshotUrl
            ? "screenshot_uploaded"
            : "received";
          record.issueCreateStartedAt = null;
          await saveRecord(record);
          throw new HttpError(
            503,
            "github_unavailable",
            "反馈暂未提交，请稍后重试。",
            30,
          );
        }

        const issue = issueReference(createdIssue.data);
        if (!issue) {
          throw pendingIssueError(record.id);
        }
        record.issue = issue;
        record.state = "complete";
        await saveRecord(record);
      }
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (issueCreateMayHaveStarted) throw pendingIssueError(record.id);
      throw new HttpError(
        502,
        "github_unavailable",
        "反馈暂时无法保存，请稍后重试。",
        15,
      );
    }

    if (record.state !== "complete" || !record.issue?.url) {
      throw new HttpError(
        502,
        "github_unavailable",
        "反馈提交状态暂时无法确认，请稍后重试。",
        30,
      );
    }
    return {
      status: created ? 201 : 200,
      data: {
        id: record.id,
        number: record.issue.number,
        url: record.issue.url,
      },
    };
  }

  function release() {
    if (!releasePromise) {
      releasePromise = (async () => {
        await lockHandle?.close().catch(() => {});
        await unlink(lockPath).catch(() => {});
      })();
    }
    return releasePromise;
  }

  const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    const allowedOrigin =
      typeof origin === "string" && config.allowedOrigins.has(origin)
        ? origin
        : null;
    if (allowedOrigin) {
      response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      response.setHeader("Vary", "Origin");
    }

    if (request.method === "OPTIONS" && request.url === "/api/feedback") {
      if (!allowedOrigin) {
        requestJson(response, 403, {
          error: "origin_not_allowed",
          message: "此来源不能提交反馈。",
        });
        return;
      }
      response.statusCode = 204;
      response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type");
      response.setHeader("Access-Control-Max-Age", "600");
      response.end();
      return;
    }

    if (request.method === "GET" && request.url === "/api/feedback/health") {
      const readiness = await ensurePublicRepository();
      requestJson(
        response,
        200,
        {
          configured: config.configured,
          ready: readiness.ready,
          ...(readiness.reason ? { reason: readiness.reason } : {}),
          maxScreenshotBytes: MAX_SCREENSHOT_BYTES,
          maxDescriptionLength: MAX_DESCRIPTION_LENGTH,
        },
        allowedOrigin,
      );
      return;
    }

    if (request.method !== "POST" || request.url !== "/api/feedback") {
      requestJson(
        response,
        404,
        { error: "not_found", message: "未找到此接口。" },
        allowedOrigin,
      );
      return;
    }

    if (!config.configured) {
      requestJson(
        response,
        503,
        {
          error: "feedback_unavailable",
          message: "匿名反馈服务尚未配置，请稍后重试。",
        },
        allowedOrigin,
      );
      return;
    }
    if (!allowedOrigin) {
      requestJson(response, 403, {
        error: "origin_not_allowed",
        message: "此来源不能提交反馈。",
      });
      return;
    }
    if (
      !/^application\/json(?:\s*;|\s*$)/i.test(
        request.headers["content-type"] ?? "",
      )
    ) {
      requestJson(
        response,
        415,
        { error: "invalid_content_type", message: "请求格式无效。" },
        allowedOrigin,
      );
      return;
    }

    try {
      const rawBody = await readBody(request);
      let body;
      try {
        body = JSON.parse(rawBody.toString("utf8"));
      } catch {
        throw new HttpError(400, "invalid_json", "提交内容格式无效。");
      }
      const submission = validateSubmission(body);
      const readiness = await ensurePublicRepository();
      if (!readiness.ready) {
        throw new HttpError(
          503,
          "feedback_unavailable",
          "匿名反馈服务暂时不可用，请稍后重试。",
          60,
        );
      }

      const operation = submissionQueue.then(
        () =>
          processSubmission(
            submission,
            getClientKey(request, config.trustedProxyAddresses),
          ),
        () =>
          processSubmission(
            submission,
            getClientKey(request, config.trustedProxyAddresses),
          ),
      );
      submissionQueue = operation.catch(() => {});
      const result = await operation;
      requestJson(response, result.status, result.data, allowedOrigin);
    } catch (error) {
      if (error instanceof HttpError) {
        const data = { error: error.error, message: error.message };
        if (Number.isFinite(error.retryAfter)) {
          data.retryAfter = error.retryAfter;
          response.setHeader("Retry-After", String(error.retryAfter));
        }
        requestJson(response, error.status, data, allowedOrigin);
        return;
      }
      requestJson(
        response,
        500,
        { error: "internal_error", message: "服务暂时不可用，请稍后重试。" },
        allowedOrigin,
      );
    }
  });

  server.on("close", () => {
    void release();
  });
  server.releaseFeedbackLock = release;
  return server;
}

if (isMainModule()) {
  const port = Number.parseInt(process.env.FEEDBACK_PORT || "4186", 10);
  const host = process.env.FEEDBACK_HOST || "127.0.0.1";
  try {
    const server = await createFeedbackServer();
    server.listen(
      Number.isInteger(port) && port > 0 && port <= 65_535 ? port : 4186,
      host,
    );
    server.on("listening", () => {
      const address = server.address();
      process.stdout.write(
        `反馈接收服务已启动：${address.address}:${address.port}\n`,
      );
    });
    const stop = () => {
      if (!server.listening) {
        void server.releaseFeedbackLock();
        return;
      }
      server.close(() => void server.releaseFeedbackLock());
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  } catch {
    process.stderr.write("反馈接收服务启动失败，请检查配置与本地数据目录。\n");
    process.exitCode = 1;
  }
}
