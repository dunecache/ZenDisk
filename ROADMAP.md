# ZenDisk roadmap

Living plan for implementing the ZenDisk UI specification (`Spec.md`). Update checkboxes and the "Decisions & deviations" section as work lands.

**Current status:** Phases 0–3 complete — monorepo scaffold, Tauri v2 shell, design tokens, foundation and shared data components, desktop shell, and all five main screens are in place. Dependencies installed, `pnpm typecheck` passes, Windows CI builds a signed NSIS installer. Advanced screens (Phase 4) are next.

**Runtime:** Tauri v2 (spec originally said Electron, then Neutralinojs; see `Spec.md` §32 / `AGENTS.md` / `docs/tauri-v2-migration.md`). Windows 10/11 only.

---

## Phase 0 — Scaffold ✅

- [x] pnpm workspace (`apps/*`, `packages/*`) with root scripts
- [x] ~~`@zendisk/desktop` Neutralinojs app config (`neutralino.config.json`)~~ — superseded by `src-tauri/tauri.conf.json`
- [x] Vite + React + Tailwind setup (`vite.config.ts`, `index.html`)
- [x] ~~`@neutralinojs/lib` init in renderer `main.tsx`~~ — superseded: Tauri initialises itself; no `init()` call
- [x] Typed native-API facade (`src/renderer/lib/native/`)
- [x] Full component/feature folder structure from spec
- [x] `@zendisk/shared`, `@zendisk/core`, `@zendisk/ui` packages
- [x] Design token foundation (`tokens.css`, `themes.css`, `typography.css`, `components.css`, `globals.css`)
- [x] Placeholder app icon
- [x] Granular subfolders (data-display: tables/metrics/charts/storage; per-feature workflow folders; stores, hooks, lib, styles/fonts, types) with `.gitkeep` placeholders

---

## Phase 1 — Foundation

Goal: a working shell with the core interaction primitives.

- [x] Design tokens (CSS variables, both themes, chart palette, motion)
- [x] Typography primitives (type scale, Inter / IBM Plex Mono)
- [x] Theme provider (`ThemeProvider` + `.dark` class persistence via Zustand) — modes: light / dark / system, OS live tracking, persisted preference
- [x] `Button` — variants: primary, secondary, outline, ghost, destructive, link; sizes xs–lg + icon; loading/disabled states (shadcn cva + Radix Slot, token-styled)
- [x] `IconButton` — accessible labels + native title tooltip (Radix Tooltip upgrade pending at the Tooltip item)
- [x] `Input` — text, search, numeric, path, clearable, validation (`aria-invalid`)
- [x] `Select` — Radix single-select with groups, disabled options, empty state; `SearchableSelect` (Popover + filter input) for long lists
- [x] `Checkbox`, `Switch`, `RadioGroup`, `Slider`
- [x] `Tabs` (no deep nesting) — Radix Tabs, token-styled triggers
- [x] `Tooltip`, `DropdownMenu`, `ContextMenu`, `Separator` — Radix primitives; `IconButton` upgraded to Radix Tooltip with a shared `TooltipProvider`; menu styles shared between Dropdown/Context menus
- [x] `Dialog`, `AlertDialog`, `Sheet`/`Drawer` — Radix-based; `ProgressDialog` uses a local token bar until Phase 2's `ProgressBar` lands. Added `--overlay` token (both themes) for modal backdrops.
- [x] `Sidebar` — 220px / 64px collapsed, persisted width + collapsed state (Zustand), active matcha state, Radix tooltips, brand + collapse control
- [x] `AppShell` — sidebar, independently scrolling main, status bar with background-task/scans/drive/version slots (dialog + tooltip portals via Radix)
- [x] `PageHeader` — title, breadcrumbs, contextual selector, actions, notifications slots
- [x] `PageContainer`, `Section`, `Stack`, `Inline`, `SplitPanel`, `Card`, `StatusBar`
- [x] Router skeleton with all 11 paths (9 screens + license/help) and `AppShell` composition; placeholder screens until Phases 3–4
- [x] Global shortcuts scaffold (Ctrl+K, Ctrl+1, Ctrl+2, Ctrl+F, Ctrl+, Ctrl+R, Escape, Delete) with input-focus guards. Installed in `AppShell`; search/refresh/delete callbacks are no-ops until features supply them. Escape handled natively by Radix.

**Exit criteria:** shell renders at 1440×900 and 900×600; both themes switch; all foundation primitives have loading/disabled/error variants where relevant.

**Phase 1 status: complete** (all items checked; `pnpm typecheck` passes).

---

## Phase 2 — Shared data components

- [x] `MetricCard`, `DriveCard`, `StorageBar`, `ProgressBar`
- [x] `FileSize` (binary units, consistent precision), `DateDisplay` (exact timestamp tooltip)
- [x] `StatusBadge` (healthy, warning, critical, running, completed, failed, paused) — icon + label, not color alone
- [x] `FileIcon`, `FileRow`, `FolderRow`, `FileList`, `BreadcrumbPath`, `FileDetailsPanel`, `FilePreview`
- [x] `DataTable` — sorting, filtering, selection, multi-select, column visibility, pagination, loading/empty states. Column resizing and virtualization deferred (pagination chosen per "or").
- [x] `SearchInput`, `FilterBar`, `EmptyState`, `Skeleton`
- [x] `Toast` (success, info, warning, error) + toast viewport
- [x] `Treemap` — squarified layout, labels, hover details, selection, drill-down callback, legend, accessible list. Breadcrumb/zoom are screen-level (disk analysis) concerns.
- [x] `InlineAlert`, `OperationSummary`, `ProgressDialog`
- [x] Bulk-action toolbar pattern for file selection

**Exit criteria:** components consume only tokens; every data component has empty/loading/error/partial states; Treemap has a non-color way to distinguish categories.

**Phase 2 status: complete** (all items checked; `pnpm typecheck` passes).

---

## Phase 3 — Main screens

- [x] `/overview` — StorageSummary, DriveCards, QuickActions, RecentActivity, Recommendations (dismissible, evidence-based). Mock-backed via TanStack Query; loading/error/empty states included.
- [x] `/disk-analysis` — drive selector, capacity summary, Treemap with drill-down/breadcrumbs, file-type breakdown, largest files/folders, scan states, filters (mock-backed)
- [x] `/cleanup` — tabs, category selection, review of exact files, warnings, explicit deletion confirmation, summary. Records operation history. Custom/Advanced tabs are marked as later iterations.
- [x] `/organization` — tabs, split-panel rule list/editor, preview table with conflict badges, apply-selected. Templates/History marked as later iterations.
- [x] `/duplicates` — tabs, grouped results, hash details, manual selection, recoverable quarantine. Never auto-deletes on hash match.

**Exit criteria:** full navigation between screens; quick actions route correctly; no screen implies all identified files are safe; every destructive path has preview + confirmation + history entry.

**Phase 3 status: complete** (all five screens built with mock-backed queries; `pnpm typecheck` passes).

---

## Phase 4 — Advanced screens

- [ ] `/maintenance` — Overview (CPU/memory/disk/temperature *where supported*), Startup, Applications, Disk Health with source & limitations
- [ ] `/automation` — Scheduled Tasks / History, task cards, task editor, always-disable guarantee
- [ ] `/reports` — recovered/duplicates/organized metrics, storage growth chart, activity timeline, recommendations
- [ ] `/settings` — General, Appearance, Notifications, Cleanup, Organization, Storage, Privacy, License
- [ ] License and plan + Help entry points from sidebar

**Exit criteria:** no unsupported metric presented as a measurement; scheduled actions can always be disabled; settings explain consequences.

---

## Phase 5 — Polish

- [ ] Dark theme audit (equal polish to light)
- [ ] Keyboard shortcuts + focus management
- [ ] Accessibility pass (contrast, screen readers, dialogs, reduced motion)
- [ ] Loading, empty, error, permission, drive-unavailable states on every screen
- [ ] Responsive window behavior (1440+ / 1100–1439 / 900–1099)
- [ ] Micro-interactions using spec durations (120/100/140/180/180/200ms)
- [ ] Quality checklist sign-off from `Spec.md` Part IX
- [ ] Windows NSIS `tauri build` smoke test

---

## Technical risks / open questions

1. **Drive capacity & health data.** Tauri's web APIs do not expose disk size/SMART directly. Options: custom Rust commands (preferred), or a tightly scoped `shell:allow-execute` grant for allowlisted OS commands. Decide before Phase 3/4. Do not fake values.
2. **Startup/applications inventory.** Platform-specific; implement as custom Rust commands. Define a "supported/unsupported" UI state.
3. ~~**`nativeAllowList` scope.**~~ Resolved: replaced wildcards with an explicit method list in the old `neutralino.config.json`, then superseded by Tauri capability grants in `src-tauri/capabilities/default.json`. Keep each grant least-privilege and add scopes only when a native operation lands.
4. **shadcn/ui dependency.** Spec recommends it as a foundation. Adding Radix/CVA deps is a deliberate decision — make it before Phase 1 component work, or implement equivalents with tokens only.
5. **Local fonts.** Package Inter and IBM Plex Mono files (or self-host) rather than relying on network fonts; CSP currently allows only `data:`/`self` font sources.
6. **Native API behavior in browser preview.** `pnpm dev:web` has no Tauri IPC; use typed facade stubs/mocks for UI development rather than calling `@tauri-apps/api` or plugin packages. `useAppVersion` falls back to `0.0.0` there.

---

## Decisions & deviations

Earlier Neutralinojs entries are kept as history and marked superseded by the Tauri v2 row below.

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-11-20 | ~~Desktop runtime is Neutralinojs, not Electron.~~ **(superseded)** | Replaced by Tauri v2 below. |
| 2026-11-20 | ~~`injectGlobals: true`; no `__neutralino_globals.js` script tag.~~ **(superseded)** | Neutralino-only. |
| 2026-11-20 | ~~`clientLibrary` omitted from CLI config.~~ **(superseded)** | Neutralino-only. |
| 2026-11-20 | `@zendisk/core` kept as a reserved package, not wired into desktop. | Avoid implying a main process exists; available for future framework-agnostic logic. |
| 2026-11-20 | Expanded the renderer tree with responsibility-based subfolders; empty folders use `.gitkeep`. | Maps the spec's component/screen catalog to concrete locations without implementing components. |
| 2026-11-20 | Adopted shadcn/ui as the primitive foundation: `components.json`, cva + Radix Slot, `cn()` via clsx/tailwind-merge. All visual values remain ZenDisk tokens. | Spec recommends shadcn as a foundation; user chose to adopt it. Added deps: `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`. |
| 2026-11-20 | Theme modes are light / dark / system (system default); preference persisted in Zustand under `zendisk-theme`. | Respects OS color scheme while keeping an explicit user override. |
| 2026-11-20 | Added tokens `--secondary-foreground`, `--danger-foreground`, `--control-height-{xs,sm,lg}`. | Needed for token-only contrast and button sizing; no hardcoded colors introduced. |
| 2026-11-20 | Phase 1 form controls use Radix primitives: `@radix-ui/react-{checkbox,popover,radio-group,select,slider,switch}`. | shadcn foundation. Multi-select in `Select` deferred until a workflow requires it; `SearchableSelect` covers searchable single-select. |
| 2026-11-20 | `pnpm install` + `pnpm typecheck` pass. Native builds for esbuild/bufferutil/utf-8-validate are denied via `allowBuilds` in `pnpm-workspace.yaml`. | Termux cannot link esbuild's android-arm64 binary or run node-gyp; not needed for typechecking. Vite builds may need a different environment. |
| 2026-11-20 | Added Radix Tabs / Tooltip / DropdownMenu / ContextMenu / Separator. `IconButton` now uses Radix Tooltip; `TooltipProvider` wraps the app. | Completes the interaction primitives in Phase 1 #4; all styling stays token-only. |
| 2026-11-20 | Added Dialog / AlertDialog / Sheet / ProgressDialog using Radix Dialog & AlertDialog. Added `--overlay` token to both themes. | Completes Phase 1 #5. `ProgressDialog` uses a local progress bar to avoid a forward dependency on Phase 2 `ProgressBar`; swap later. |
| 2026-11-20 | Built the desktop shell: Sidebar (persisted collapse/width), PageHeader, layout helpers, StatusBar, and a router with placeholder screens. | Completes Phase 1 #6. Router skeleton item marked done here. |
| 2026-11-20 | Added `useGlobalShortcuts` with input-focus guards; Escape left to Radix. Replaced wildcard `nativeAllowList` entries with an explicit method list. | Completes Phase 1 #7 and advances least-privilege native access. |
| 2026-11-20 | ~~Added `.github/workflows/build-windows.yml` for `neu build` packaging.~~ **(superseded)** | Rewritten for Tauri: `pnpm tauri build` + signed NSIS + `latest.json`. |
| 2026-11-20 | Phase 2 data components built sequentially with a typecheck + commit after each batch. Chose DataTable pagination over virtualization; Treemap drill-down/zoom delegated to the Disk Analysis screen. | Meets "pagination or virtualization" and keeps screen-specific navigation out of the shared widget. |
| 2026-11-20 | Phase 3 uses isolated mock data behind TanStack Query hooks (`lib/native/mock-data.ts`, `hooks/data/`). Swapping to `nativeApi` is a one-line change per hook. `QueryProvider` added to App. | Enables fully interactive screens in the browser while native operations remain stubbed. |
| 2026-11-20 | Migrated the desktop shell to **Tauri v2** (Rust crate in `apps/desktop/src-tauri/`). Removed `@neutralinojs/lib` / `@neutralinojs/neu`; added `@tauri-apps/api`, `@tauri-apps/cli` and plugins `fs`, `shell`, `dialog`, `os`, `store`, `updater`, `process`. | Signed OTA updates, single NSIS installer, small footprint. Full plan in `docs/tauri-v2-migration.md`. |
| 2026-11-20 | Windows 7 dropped; Windows 10/11 are the supported targets. | Rust's `*-pc-windows-msvc` targets require Windows 10+, and current WebView2 docs list Win10/11 only. Tauri's Win7 documentation is stale. |
| 2026-11-20 | Ship **NSIS `setup.exe` only** — no portable exe and no MSI. | Single artifact supports the updater and WebView2 bootstrap install. |
| 2026-11-20 | `webviewInstallMode: embedBootstrapper` with `silent: true`; NSIS `installMode: currentUser`. | Fewer install failures than `downloadBootstrapper`; no admin rights required. |
| 2026-11-20 | Updater signing key generated in a temporary `ubuntu-latest` workflow (artifact storage quota was hit, so keys were printed to a private run log) and imported via `gh secret set TAURI_SIGNING_PRIVATE_KEY`. All keygen runs deleted. Public key committed in `tauri.conf.json`. | Tauri requires minisign signatures; the secret must never be committed. The key has an empty password — acceptable for this private repo, to be revisited if the repo is published. |
| 2026-11-20 | CI injects `0.1.<github.run_number>` on main and `0.0.<run_number>` on PRs via `--config`; `createUpdaterArtifacts` is disabled on PRs. | Updater ignores equal versions; a static `0.0.0` would never update. PRs have no signing secret. |
| 2026-11-20 | Published assets: NSIS `setup.exe`, `.sig`, and `latest.json`, uploaded in that order to the rolling `windows-latest` pre-release; old `zendisk-release.zip` removed. | Avoids quota-limited Actions artifacts; the manifest is last so clients never see a signature for a missing asset. |
