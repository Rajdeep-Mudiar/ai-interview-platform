const { spawn } = require("child_process");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels";
const FRONTEND_ENV_LOCAL = path.join(__dirname, "..", "frontend", ".env.local");
const NGROK_CONFIG_FILE = path.join(__dirname, "..", ".ngrok-dev.yml");

const PORTS = {
  backend: 8000,
  ai: 8001,
  frontend: 5173,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toWsUrl(httpUrl) {
  if (httpUrl.startsWith("https://")) {
    return httpUrl.replace("https://", "wss://");
  }
  if (httpUrl.startsWith("http://")) {
    return httpUrl.replace("http://", "ws://");
  }
  return httpUrl;
}

function ensureNgrokConfig() {
  if (fs.existsSync(NGROK_CONFIG_FILE)) {
    return;
  }

  const configText = [
    'version: "2"',
    "tunnels:",
    `  backend:`,
    "    proto: http",
    `    addr: ${PORTS.backend}`,
    `  ai:`,
    "    proto: http",
    `    addr: ${PORTS.ai}`,
    `  frontend:`,
    "    proto: http",
    `    addr: ${PORTS.frontend}`,
    "",
  ].join("\n");

  fs.writeFileSync(NGROK_CONFIG_FILE, configText, "utf8");
}

function findTunnelUrlByPort(tunnels, port) {
  const portText = String(port);

  const match = tunnels.find((tunnel) => {
    const cfgAddr = String(tunnel?.config?.addr || "");
    const cmdAddr = String(tunnel?.command_line?.addr || "");
    return (
      cfgAddr.endsWith(`:${portText}`) ||
      cfgAddr === portText ||
      cmdAddr.endsWith(`:${portText}`) ||
      cmdAddr === portText
    );
  });

  if (match?.public_url) {
    return match.public_url;
  }

  return null;
}

async function getNgrokUrls(retries = 30, delayMs = 1500) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const res = await axios.get(NGROK_API_URL, { timeout: 2000 });
      const tunnels = res?.data?.tunnels || [];

      const backendUrl = findTunnelUrlByPort(tunnels, PORTS.backend);
      const aiUrl = findTunnelUrlByPort(tunnels, PORTS.ai);
      const frontendUrl = findTunnelUrlByPort(tunnels, PORTS.frontend);

      if (backendUrl && aiUrl && frontendUrl) {
        return {
          backendUrl,
          aiUrl,
          frontendUrl,
        };
      }
    } catch (error) {
      // ngrok API may not be ready yet; retry
    }

    await sleep(delayMs);
  }

  throw new Error("Timed out waiting for ngrok tunnel URLs.");
}

function writeFrontendEnv(urls) {
  const env = [
    `VITE_API_BASE_URL=${urls.backendUrl}`,
    `VITE_AI_BASE_URL=${urls.aiUrl}`,
    `VITE_BACKEND_WS_BASE_URL=${toWsUrl(urls.backendUrl)}`,
    `VITE_MOBILE_MONITORING_BASE_URL=${urls.frontendUrl}`,
    "",
  ].join("\n");

  fs.writeFileSync(FRONTEND_ENV_LOCAL, env, "utf8");
}

function clearFrontendEnv() {
  if (fs.existsSync(FRONTEND_ENV_LOCAL)) {
    fs.unlinkSync(FRONTEND_ENV_LOCAL);
  }
}

async function start() {
  ensureNgrokConfig();
  console.log(
    "Starting ngrok tunnels (backend:8000, ai:8001, frontend:5173)...",
  );

  let ngrokExited = false;
  const ngrok = spawn(
    "ngrok",
    ["start", "--all", "--config", NGROK_CONFIG_FILE],
    {
      stdio: "inherit",
    },
  );

  ngrok.on("error", (error) => {
    console.error("Failed to start ngrok:", error.message);
  });

  ngrok.on("exit", (code) => {
    ngrokExited = true;
    console.log(`ngrok exited with code ${code}`);
  });

  try {
    const urls = await getNgrokUrls();
    if (ngrokExited) {
      throw new Error("ngrok exited before tunnel URLs were available.");
    }

    console.log("Ngrok backend URL:", urls.backendUrl);
    console.log("Ngrok AI URL:", urls.aiUrl);
    console.log("Ngrok frontend URL:", urls.frontendUrl);

    writeFrontendEnv(urls);
    console.log("Frontend env updated:", FRONTEND_ENV_LOCAL);
  } catch (error) {
    clearFrontendEnv();
    console.error("Failed to get ngrok tunnel URLs:", error.message);
    console.error("Cleared frontend/.env.local to avoid stale ngrok URLs.");
    console.error(
      "Fix ngrok auth first: ngrok config add-authtoken <TOKEN> and verify your ngrok account email.",
    );
    process.exit(1);
  }

  const cleanup = () => {
    if (!ngrok.killed) {
      ngrok.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  ngrok.on("exit", (code) => process.exit(code ?? 0));
}

start();
