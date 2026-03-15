import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["cogitative-disobligingly-dawne.ngrok-free.dev"],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/ai": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ai/, ""),
      },
      "/secondary-ai": {
        target: "http://127.0.0.1:8002",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/secondary-ai/, ""),
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
