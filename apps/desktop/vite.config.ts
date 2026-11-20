import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const rendererRoot = resolve(appRoot, "src/renderer");

export default defineConfig({
  // Neutralino serves the built frontend from `documentRoot: "/dist/"`.
  root: rendererRoot,
  base: "./",
  resolve: {
    alias: {
      "@": rendererRoot,
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: resolve(appRoot, "dist"),
    emptyOutDir: true,
  },
});
