import React from "react";
import ReactDOM from "react-dom/client";
import { init } from "@neutralinojs/lib";
import { App } from "./app/App";
import "./styles/globals.css";

// `injectGlobals: true` injects NL_* globals into the Neutralino webview.
// Only initialize the native client when they exist, so the frontend can also
// be previewed in a plain browser via `pnpm dev:web`. `NL_PORT` is declared by
// @neutralinojs/lib, so no local Window augmentation is needed.
if (typeof window !== "undefined" && window.NL_PORT) {
  init();
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" was not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
