import { execSync } from "node:child_process";

const port = Number(process.argv[2] ?? 4000);
if (!Number.isFinite(port)) process.exit(0);

try {
  if (process.platform === "win32") {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set(
      out
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop())
        .filter((pid) => pid && /^\d+$/.test(pid)),
    );
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } catch {
        /* ignore */
      }
    }
  } else {
    execSync(`lsof -ti:${port} | xargs -r kill -9`, { stdio: "ignore", shell: true });
  }
} catch {
  /* port likely free */
}
