// Local development only: use the current gh session without writing a token to disk.
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { homedir } from "node:os";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let token = process.env.FEEDBACK_GITHUB_TOKEN;
if (!token) {
  try {
    token = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
      timeout: 10000,
    }).trim();
  } catch {
    console.error(
      "无法读取本机 GitHub 登录状态。请先运行 gh auth login，再启动反馈服务。",
    );
    process.exit(1);
  }
}
const child = spawn(process.execPath, ["server/feedback-server.mjs"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    FEEDBACK_GITHUB_OWNER: "brin666",
    FEEDBACK_GITHUB_REPO: "periodic-table-feedback",
    FEEDBACK_ALLOWED_ORIGINS: "http://127.0.0.1:4178,http://localhost:4178",
    FEEDBACK_DATA_DIR: resolve(homedir(), ".periodic-table-lab-feedback"),
    ...Object.fromEntries(
      Object.entries(process.env).filter(([key]) =>
        key.startsWith("FEEDBACK_"),
      ),
    ),
    FEEDBACK_GITHUB_TOKEN: token,
  },
  stdio: "inherit",
  windowsHide: true,
});
token = "";
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}
child.once("exit", (code) => process.exit(code ?? 1));
child.once("error", () => {
  console.error("反馈服务未能启动，请检查端口 4186 是否可用。");
  process.exit(1);
});
