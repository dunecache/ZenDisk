# Native API boundary

This folder is the single privileged-operation boundary for the renderer (the Neutralinojs equivalent of a preload bridge).

- `client.ts` exposes a single typed facade (`nativeApi`) that all UI code uses.
- Never import `@neutralinojs/lib` namespaces from components or features — add
  a typed, validated method here instead.
- Allowed native namespaces are declared in `apps/desktop/neutralino.config.json`
  under `nativeAllowList` (least privilege).

Neutralino globals are injected by `injectGlobals: true` in window mode, and
`@neutralinojs/lib`'s `init()` is called from `renderer/main.tsx`.
