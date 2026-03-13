import axios from "axios";
import { getUserSession, clearUserSession } from "./auth";

const axiosClient = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// AI Services (Main & Secondary)
const aiClient = axios.create({
  baseURL: "http://localhost:8001",
  headers: {
    "Content-Type": "application/json",
  },
});

const secondaryAiClient = axios.create({
  baseURL: "http://localhost:8002",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach Session Info
axiosClient.interceptors.request.use(
  (config) => {
    const session = getUserSession();
    if (session?.id) {
      config.headers["X-User-ID"] = session.id;
      config.headers["X-User-Role"] = session.role;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
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
  }
);

export { aiClient, secondaryAiClient };
export default axiosClient;
