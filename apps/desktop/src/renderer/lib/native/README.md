# Native API boundary

This folder is the single privileged-operation boundary for the renderer.

- `client.ts` exposes a single typed facade (`nativeApi`) that all UI code uses.
- Never import `@tauri-apps/api` or `@tauri-apps/plugin-*` directly from
  components or features — add a typed, validated method here instead.
- Tauri commands and plugin permissions are granted in
  `apps/desktop/src-tauri/capabilities/default.json` (least privilege).
- The Tauri runtime initialises itself in the webview; there is no `init()` call
  in `renderer/main.tsx`.

The renderer can still be previewed in a plain browser with `pnpm dev:web`.
Only facade methods backed by Tauri APIs are unavailable there; they fail
gracefully and the UI falls back to safe defaults.
