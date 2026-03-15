import axios from "axios";
import { getUserSession, clearUserSession } from "./auth";

const FRONTEND_PROTOCOL = window.location.protocol;
const FRONTEND_HOST = window.location.hostname;
const FRONTEND_ORIGIN = window.location.origin;

const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "/api"
  : `${FRONTEND_PROTOCOL}//${FRONTEND_HOST}:8000`;

const DEFAULT_AI_BASE_URL = import.meta.env.DEV
  ? "/ai"
  : `${FRONTEND_PROTOCOL}//${FRONTEND_HOST}:8001`;

const DEFAULT_SECONDARY_AI_BASE_URL = import.meta.env.DEV
  ? "/secondary-ai"
  : `${FRONTEND_PROTOCOL}//${FRONTEND_HOST}:8002`;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || DEFAULT_AI_BASE_URL;

const SECONDARY_AI_BASE_URL =
  import.meta.env.VITE_SECONDARY_AI_BASE_URL || DEFAULT_SECONDARY_AI_BASE_URL;

const monitoringWsBase =
  import.meta.env.VITE_BACKEND_WS_BASE_URL ||
  (API_BASE_URL.startsWith("http")
    ? API_BASE_URL.replace(/^http/i, "ws")
    : `${FRONTEND_ORIGIN.replace(/^http/i, "ws")}${API_BASE_URL}`);

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// AI Services (Main & Secondary)
const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const secondaryAiClient = axios.create({
  baseURL: SECONDARY_AI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function addNgrokBypassHeaders(config) {
  const base = config.baseURL || "";
  if (
    base.includes("ngrok-free.app") ||
    base.includes("ngrok-free.dev") ||
    base.includes("ngrok.io")
  ) {
    config.headers["ngrok-skip-browser-warning"] = "true";
    config.headers.Accept = "application/json";
  }
  return config;
}

// Request Interceptor: Attach Session Info
axiosClient.interceptors.request.use(
  (config) => {
    addNgrokBypassHeaders(config);
    const session = getUserSession();
    if (session?.id) {
      config.headers["X-User-ID"] = session.id;
      config.headers["X-User-Role"] = session.role;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

aiClient.interceptors.request.use(
  (config) => addNgrokBypassHeaders(config),
  (error) => Promise.reject(error),
);

secondaryAiClient.interceptors.request.use(
  (config) => addNgrokBypassHeaders(config),
  (error) => Promise.reject(error),
);

// Response Interceptor: Handle Global Errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearUserSession();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export { aiClient, monitoringWsBase, secondaryAiClient };
export { API_BASE_URL, AI_BASE_URL, SECONDARY_AI_BASE_URL };
export default axiosClient;
