# ZenDisk roadmap

Living plan for implementing the ZenDisk UI specification (`Spec.md`). Update checkboxes and the "Decisions & deviations" section as work lands.

**Current status:** Phases 0 and 1 complete — monorepo scaffold, Neutralinojs shell, folder structure, design tokens, foundation components, and the desktop shell are in place. Dependencies are installed and `pnpm typecheck` passes. Feature screens are still placeholders; Phase 2 (shared data components) is next.

**Runtime:** Neutralinojs (spec originally said Electron; see `Spec.md` §32 / `AGENTS.md`).

---

## Phase 0 — Scaffold ✅

- [x] pnpm workspace (`apps/*`, `packages/*`) with root scripts
- [x] `@zendisk/desktop` Neutralinojs app config (`neutralino.config.json`)
- [x] Vite + React + Tailwind setup (`vite.config.ts`, `index.html`)
- [x] `@neutralinojs/lib` init in renderer `main.tsx` (guarded for browser preview)
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

- [ ] `MetricCard`, `DriveCard`, `StorageBar`, `ProgressBar`
- [ ] `FileSize` (binary units, consistent precision), `DateDisplay` (exact timestamp tooltip)
- [ ] `StatusBadge` (healthy, warning, critical, running, completed, failed, paused)
- [ ] `FileIcon`, `FileRow`, `FolderRow`, `FileList`, `BreadcrumbPath`, `FileDetailsPanel`, `FilePreview`
- [ ] `DataTable` — sorting, filtering, selection, multi-select, column visibility/resizing, pagination or virtualization, empty/loading states, context menu
- [ ] `SearchInput`, `FilterBar`, `EmptyState`, `Skeleton`
- [ ] `Toast` (success, info, warning, error) + toast viewport
- [ ] `Treemap` — hierarchy, labels, hover details, selection, zoom, breadcrumbs, legend, accessible list
- [ ] `InlineAlert`, `OperationSummary`, `ProgressDialog`
- [ ] Bulk-action toolbar pattern for file selection

**Exit criteria:** components consume only tokens; every data component has empty/loading/error/partial states; Treemap has a non-color way to distinguish categories.

---

## Phase 3 — Main screens

- [ ] `/overview` — StorageSummary, DriveCards, QuickActions, RecentActivity, Recommendations (dismissible, evidence-based)
- [ ] `/disk-analysis` — drive selector, capacity summary, Treemap, file-type breakdown, largest files/folders, scan states, filters
- [ ] `/cleanup` — Quick Scan / Custom / Advanced tabs, category selection, review workflow, confirmation, summary
- [ ] `/organization` — Rules / Templates / Preview / History, split-panel rule builder, preview table with conflicts
- [ ] `/duplicates` — Exact / Similar Names / Images / Media tabs, grouped results, hash details, manual selection, quarantine

**Exit criteria:** full navigation between screens; quick actions route correctly; no screen implies all identified files are safe; every destructive path has preview + confirmation + history entry.

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
- [ ] `neu build --release` smoke test

---

## Technical risks / open questions

1. **Drive capacity & health data.** Neutralino's web APIs do not expose disk size/SMART directly. Options: `os.exec` allowlisted OS commands, a Neutralino extension, or a small native helper. Decide before Phase 3/4. Do not fake values.
2. **Startup/applications inventory.** Platform-specific; may require extensions or OS command execution. Define a "supported/unsupported" UI state.
3. ~~**`nativeAllowList` scope.**~~ Resolved: replaced wildcards with an explicit method list in `neutralino.config.json`. `os.execCommand` is retained because drive/SMART data needs it; keep its inputs strictly allowlisted in the native facade.
4. **shadcn/ui dependency.** Spec recommends it as a foundation. Adding Radix/CVA deps is a deliberate decision — make it before Phase 1 component work, or implement equivalents with tokens only.
5. **Local fonts.** Package Inter and IBM Plex Mono files (or self-host) rather than relying on network fonts; CSP currently allows only `data:`/`self` font sources.
6. **Native API behavior in browser preview.** `pnpm dev:web` has no native API; use typed facade stubs/mocks for UI development rather than calling `@neutralinojs/lib`.

---

## Decisions & deviations

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-11-20 | Desktop runtime is Neutralinojs, not Electron. | Lighter footprint; user direction. Spec §32 superseded by `src/renderer/lib/native/`. |
| 2026-11-20 | `injectGlobals: true`; no `__neutralino_globals.js` script tag. | Simplifies Vite HMR integration with `neu run`. |
| 2026-11-20 | `clientLibrary` omitted from CLI config. | Client is bundled from npm `@neutralinojs/lib` instead of downloaded from GitHub releases. |
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
