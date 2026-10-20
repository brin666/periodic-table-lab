import { randomUUID } from "node:crypto";
import { realpathSync } from "node:fs";
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  unlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function getDataDirectory(env = process.env) {
  return path.resolve(
    env.FEEDBACK_DATA_DIR ||
      path.join(os.homedir(), ".periodic-table-lab-feedback"),
  );
}

async function readReport(reportPath) {
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    throw new Error("Invalid report journal.");
  }
  return report;
}

async function listPending(dataDir) {
  const reportsDir = path.join(dataDir, "reports");
  let entries;
  try {
    entries = await readdir(reportsDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const pendingIds = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const id = entry.name.slice(0, -5);
    if (!UUID_PATTERN.test(id)) continue;
    const record = await readReport(path.join(reportsDir, entry.name));
    if (record.id !== id)
      throw new Error("Report journal ID does not match its filename.");
    if (record.state === "issue_create_started") pendingIds.push(id);
  }
  pendingIds.sort();
  return pendingIds;
}

async function writeJsonAtomically(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  let handle;
  try {
    handle = await open(tempPath, "wx", 0o600);
    await handle.writeFile(`${JSON.stringify(value)}\n`, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(tempPath, filePath);
    let directory;
    try {
      directory = await open(path.dirname(filePath), "r");
      await directory.sync();
    } catch {
      // Directory fsync is unsupported on some platforms; the report itself is synced.
    } finally {
      await directory?.close().catch(() => {});
    }
  } finally {
    await handle?.close().catch(() => {});
    await unlink(tempPath).catch(() => {});
  }
}

async function withExclusiveServiceLock(dataDir, operation) {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const lockPath = path.join(dataDir, ".feedback-server.lock");
  let handle;
  try {
    handle = await open(lockPath, "wx", 0o600);
  } catch (error) {
    if (error?.code === "EEXIST") {
      throw new Error(
        "The feedback service lock exists; stop the service and resolve any stale lock before recovery.",
      );
    }
    throw error;
  }

  try {
    await handle.writeFile(
      `${JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })}\n`,
      "utf8",
    );
    await handle.sync();
    return await operation();
  } finally {
    await handle.close().catch(() => {});
    await unlink(lockPath).catch(() => {});
  }
}

async function reopenConfirmedAbsent(dataDir, id) {
  const reportPath = path.join(dataDir, "reports", `${id}.json`);
  return withExclusiveServiceLock(dataDir, async () => {
    const record = await readReport(reportPath);
    if (
      record.id !== id ||
      record.state !== "issue_create_started" ||
      typeof record.issueCreateStartedAt !== "string"
    ) {
      throw new Error("The journal is not an unresolved issue-create record.");
    }

    // Preserve every other journal field; only make this explicitly confirmed
    // no-create attempt eligible for a client retry.
    record.state = record.screenshotUrl ? "screenshot_uploaded" : "received";
    record.issueCreateStartedAt = null;
    await writeJsonAtomically(reportPath, record);
    return id;
  });
}

function usage() {
  return [
    "Usage:",
    "  node server/feedback-admin.mjs list-pending",
    "  node server/feedback-admin.mjs retry-confirmed-absent <UUID> --confirmed-absent",
  ].join("\n");
}

async function main(args) {
  const dataDir = getDataDirectory();
  if (args.length === 1 && args[0] === "list-pending") {
    process.stdout.write(
      `${JSON.stringify({ pendingIds: await listPending(dataDir) })}\n`,
    );
    return;
  }

  if (
    args.length === 3 &&
    args[0] === "retry-confirmed-absent" &&
    UUID_PATTERN.test(args[1]) &&
    args[2] === "--confirmed-absent"
  ) {
    const id = await reopenConfirmedAbsent(dataDir, args[1]);
    process.stdout.write(`${JSON.stringify({ reopened: id })}\n`);
    return;
  }

  throw new Error(usage());
}

if (isMainModule()) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Feedback administration failed."}\n`,
    );
    process.exitCode = 1;
  }
}
