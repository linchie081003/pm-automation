import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const lockPath = resolve(process.cwd(), ".next/dev/lock");
if (!existsSync(lockPath)) {
  process.exit(0);
}

function pidAlive(pid) {
  try {
    const out = execSync(`tasklist /FI "PID eq ${pid}" /NH`, { encoding: "utf8" });
    return out.includes(String(pid));
  } catch {
    return false;
  }
}

function killPid(pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

try {
  const lock = JSON.parse(readFileSync(lockPath, "utf8"));
  const pid = Number(lock?.pid);
  if (Number.isFinite(pid) && pid > 0) {
    if (process.platform === "win32" && pidAlive(pid)) {
      console.log(`Menghentikan Next.js dev lama (PID ${pid}, port ${lock.port ?? "?"})…`);
      killPid(pid);
    } else if (process.platform !== "win32") {
      try {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      } catch {
        /* ignore */
      }
    }
  }
} catch {
  /* corrupt lock */
}

try {
  unlinkSync(lockPath);
} catch {
  /* ignore */
}
