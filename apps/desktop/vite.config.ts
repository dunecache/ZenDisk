import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = dirname(fileURLToPath(import.meta.url));
const rendererRoot = resolve(appRoot, "src/renderer");

export default defineConfig({
  root: rendererRoot,
  base: "./",
  // Tauri manages the terminal output; keep Vite from clearing it.
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  resolve: {
    alias: {
      "@": rendererRoot,
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // Tauri embeds this directory into the binary at compile time.
    outDir: resolve(appRoot, "dist"),
    emptyOutDir: true,
    target:
      process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13",
    minify: !process.env.TAURI_ENV_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
