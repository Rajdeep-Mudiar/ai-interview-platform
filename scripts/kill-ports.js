const { execSync } = require("child_process");

const ports = process.argv
  .slice(2)
  .map((p) => Number(p))
  .filter((p) => Number.isInteger(p) && p > 0);

if (ports.length === 0) {
  console.log(
    "No ports provided. Usage: node scripts/kill-ports.js 5173 8000 8001",
  );
  process.exit(0);
}

function getWindowsPidsForPort(port) {
  try {
    const output = execSync(`netstat -ano -p tcp | findstr :${port}`, {
      encoding: "utf8",
    });
    const lines = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const pids = new Set();
    for (const line of lines) {
      // Expected format: TCP 0.0.0.0:8000 ... LISTENING 1234
      const parts = line.split(/\s+/);
      if (parts.length >= 5) {
        const localAddr = parts[1] || "";
        const state = parts[3] || "";
        const pid = Number(parts[4]);

        if (
          (localAddr.endsWith(`:${port}`) || localAddr.includes(`:${port}`)) &&
          state === "LISTENING" &&
          Number.isInteger(pid)
        ) {
          pids.add(pid);
        }
      }
    }

    return [...pids];
  } catch {
    return [];
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

for (const port of ports) {
  const pids = getWindowsPidsForPort(port);

  if (pids.length === 0) {
    console.log(`Port ${port}: free`);
    continue;
  }

  const killed = [];
  const failed = [];

  for (const pid of pids) {
    if (killPid(pid)) {
      killed.push(pid);
    } else {
      failed.push(pid);
    }
  }

  if (killed.length > 0) {
    console.log(`Port ${port}: terminated PID(s) ${killed.join(", ")}`);
  }
  if (failed.length > 0) {
    console.log(
      `Port ${port}: could not terminate PID(s) ${failed.join(", ")}`,
    );
  }
}
