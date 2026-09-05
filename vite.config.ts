import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Dev : le proxy `/api` pointe vers le backend Node/Express local (3000).
  // Surcharge possible via BACKEND_ORIGIN (ex: pour tester contre le PHP).
  const backendOrigin =
    env.BACKEND_ORIGIN ||
    (mode === "development"
      ? "http://localhost:3000"
      : "https://banza-ai.onekana-agency.com");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: backendOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
