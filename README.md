# ZenDisk

ZenDisk is a desktop storage management and PC maintenance workspace built with **Neutralinojs + React + TypeScript**. This repository is a pnpm monorepo containing the Neutralinojs desktop application and shared packages.

> **Status:** scaffolding only — folder structures, packages, and configuration are in place. Feature implementation is pending.

## Layout

```
ZenDisk/
├── apps/
│   └── desktop/                  # Neutralinojs app (@zendisk/desktop)
│       ├── neutralino.config.json
│       ├── vite.config.ts        # Vite root = src/renderer, output = dist/
│       └── src/renderer/         # React UI
│           ├── app/              # App root, router, providers
│           ├── components/       # Shared components by responsibility
│           ├── features/         # Screen-level feature modules
│           ├── hooks/
│           ├── lib/              # formatters, validators, utils, native API
│           ├── stores/
│           ├── styles/           # Design tokens, themes, typography
│           ├── types/
│           └── assets/
├── packages/
│   ├── shared/                   # Types, API contracts, constants (@zendisk/shared)
│   ├── core/                     # Reserved domain services (@zendisk/core)
│   └── ui/                       # Design-system primitives (@zendisk/ui)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Packages

| Package | Description |
| --- | --- |
| `@zendisk/desktop` | Neutralinojs app config plus the React renderer with all screens/features. |
| `@zendisk/shared` | Framework-agnostic types, native API contracts, constants, formatters, validators. |
| `@zendisk/core` | Reserved for domain logic (the Neutralino build uses the renderer's native facade). |
| `@zendisk/ui` | Reusable design-system component primitives and foundation styles. |

## Getting started

```bash
pnpm install
pnpm dev        # neu run — starts Vite HMR + the Neutralino window
pnpm build      # vite build for the renderer (outputs apps/desktop/dist)
pnpm build:app  # neu build --release — produce app binaries
pnpm typecheck  # typecheck all workspace packages
```

To open developer tools during development:

```bash
pnpm --filter @zendisk/desktop neu:run -- --window-enable-inspector
```

## Neutralinojs integration

- `neutralino.config.json` sets `documentRoot`/`cli.resourcesPath` to `/dist/` and configures `cli.frontendLibrary` so `neu run` drives the Vite dev server at `http://localhost:5173`.
- `injectGlobals: true` lets `@neutralinojs/lib` read the injected `NL_*` globals; `init()` is called in `src/renderer/main.tsx`.
- `cli.clientLibrary` is intentionally absent — the client is bundled from the npm package `@neutralinojs/lib` rather than downloaded from GitHub releases.
- Native access is allowlisted via `nativeAllowList` and funnelled through the typed facade in `src/renderer/lib/native/`. Components never call `@neutralinojs/lib` directly.
- Because `injectGlobals: true` is enabled, no `__neutralino_globals.js` script tag is needed in `index.html` (it would otherwise be required for non-injected modes).

## Design reference

Implements the ZenDisk React Frontend Design System & UI Specification v1.0 ("Kanso Matcha"). Design tokens live in `apps/desktop/src/renderer/styles/`.
