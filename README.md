# ZenDisk

ZenDisk is a desktop storage management and PC maintenance workspace built with **Tauri v2 + React + TypeScript**. This repository is a pnpm monorepo containing the Tauri desktop application and shared packages.

> **Status:** Phases 0–4 complete (design system, shared components, desktop shell, five main screens, four advanced screens, License/Help). All screens are UI-complete on mock data until Phase 6 native integration; see `ROADMAP.md`.

## Layout

```
ZenDisk/
├── apps/
│   └── desktop/                  # Tauri app (@zendisk/desktop)
│       ├── src-tauri/            # Rust crate, tauri.conf.json, capabilities, icons
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
├── docs/
│   ├── tauri-v2-migration.md     # Runtime migration plan and decisions
│   └── updater-key-rotation.md   # Bridge-release procedure for future key changes
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Packages

| Package | Description |
| --- | --- |
| `@zendisk/desktop` | Tauri app config plus the React renderer with all screens/features. |
| `@zendisk/shared` | Framework-agnostic types, native API contracts, constants, formatters, validators. |
| `@zendisk/core` | Reserved for domain logic (the Tauri build uses the renderer's native facade). |
| `@zendisk/ui` | Reusable design-system component primitives and foundation styles. |

## Getting started

```bash
pnpm install
pnpm dev        # tauri dev — starts Vite HMR + the Tauri window
pnpm dev:web    # Vite dev server only (browser preview, no native API)
pnpm build      # vite build -> apps/desktop/dist
pnpm build:app  # tauri build -> NSIS installer (Windows only)
pnpm typecheck  # typecheck all workspace packages
```

The Tauri CLI has no Android/Termux binary. On those hosts use `pnpm dev:web` and `pnpm typecheck`; Rust builds happen in CI.

## Tauri v2 integration

- `src-tauri/tauri.conf.json` is the runtime source of truth: identifier `io.zendisk.app`, window size, CSP, NSIS bundle, updater endpoints.
- `src-tauri/capabilities/default.json` grants only what the facade uses today: `core`, `updater`, and `process`. Further grants are added with the Phase 6 command that needs them.
- Vite writes to `apps/desktop/dist`; Tauri embeds that directory into the binary at compile time. There is no sidecar resource file.
- Native access is funnelled through the typed facade in `src/renderer/lib/native/`. Components never call Tauri APIs directly.
- `src-tauri/icons/` contains generated PNGs and `icon.ico`, derived from the brand mark in `src/renderer/assets/icon.png`.
- Signed OTA updates use `latest.json` published on the rolling `windows-latest` pre-release; the public key is in `tauri.conf.json`, the private key only in the `TAURI_SIGNING_PRIVATE_KEY` secret and its password in `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Rotation procedure: `docs/updater-key-rotation.md`.
- Windows 10/11 are supported. Windows 7 is not achievable with current Rust/WebView2 — see `docs/tauri-v2-migration.md`.

## CI

`.github/workflows/build-windows.yml` builds on push/PR to `main` and on manual dispatch. It installs dependencies, builds with `pnpm tauri build`, and produces a signed NSIS `setup.exe` plus `.sig`. On `main` it generates `latest.json` and publishes all three to the rolling `windows-latest` pre-release (Actions artifact storage is quota-limited on this account). PRs build but skip publishing and updater artifacts.

## Design reference

Implements the ZenDisk React Frontend Design System & UI Specification v1.0 ("Kanso Matcha"). Design tokens live in `apps/desktop/src/renderer/styles/`.
