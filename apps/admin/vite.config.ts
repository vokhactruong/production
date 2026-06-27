import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@school/types": path.resolve(__dirname, "../../packages/types/src"),
      "@school/constants": path.resolve(__dirname, "../../packages/constants/src"),
      "@school/auth": path.resolve(__dirname, "../../packages/auth/src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
