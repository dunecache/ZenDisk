# ZenDisk roadmap

Living plan for delivering ZenDisk from `Spec.md`: the UI surface, the native Tauri layer, and release readiness. Update checkboxes and the "Decisions & deviations" section as work lands.

**Current status:** Phases 0–3 complete, Phase 4 in progress (`/maintenance` done; `/automation`, `/reports`, `/settings`, License/Help remain). All screens built so far are **UI-complete on mock data**; real native operations begin in Phase 6. `pnpm typecheck` passes and Windows CI publishes a signed NSIS `setup.exe` with `.sig` and `latest.json` to the rolling `windows-latest` pre-release.

**Runtime:** Tauri v2 (spec originally said Electron, then Neutralinojs; see `Spec.md` §32 / `AGENTS.md` / `docs/tauri-v2-migration.md`). Windows 10/11 only.

## Delivery tracks

The spec's Part X build order covers the **product surface** only. Tauri has no Electron main process, so the native layer and release work need their own phases. Phase numbers 0–5 are kept as-is to preserve history; 6 and 7 are added.

| Track | Phases | Definition of done |
| --- | --- | --- |
| Product surface | 0–5 | Layout, tokens, both themes, interactive flows, and loading/empty/error/partial states. Data may be mock-backed. A checked screen here means **UI-complete**, not shippable. |
| Native integration | 6 | A typed operation in `src/renderer/lib/native/client.ts`, a least-privilege grant in `src-tauri/capabilities/default.json`, validated inputs/outputs, progress/cancellation where relevant, persistence, and no screen claiming a capability it lacks. |
| Release readiness | 7 | Signed installer, updater channel, clean Windows 10/11 install/upgrade/uninstall, and the spec's Part IX checklist verified against real data. |

**Sequencing:** finish Phase 4 → Phase 5 UI polish → Phase 6 native → Phase 7 release. Phase 6 introduces real permission, partial-scan, and hardware states, so those are re-audited there. If Windows 10/11 hardware is available earlier, Phase 6 can move ahead of Phase 5; it would then require a second, real-data polish pass.

## Runtime migration to Tauri v2 ✅ (install/OTA verification pending Phase 7)

- [x] Foundation swap: deps/scripts, Rust crate, `tauri.conf.json`, capabilities, generated icons; `neutralino.config.json` removed
- [x] Renderer boundary: Tauri Vite config, `HashRouter`, facade with real app version, browser-preview fallback
- [x] Plugins registered with least-privilege grants (`fs`, `shell`, `dialog`, `os`, `store`, `updater`, `process`)
- [x] Signing key generated in a temporary CI workflow, stored as `TAURI_SIGNING_PRIVATE_KEY`, keygen runs deleted
- [x] Windows CI rewritten: signed NSIS `setup.exe` + `.sig` + `latest.json` published to the rolling `windows-latest` pre-release
- [x] Docs aligned; local `pnpm typecheck`, PR CI, and main CI all green
- [ ] Windows 10/11 install and OTA smoke test on real hardware (Phase 7 — **blocked**: no Windows hardware available; CI compiles and publishes but cannot exercise the installed app)

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

**Phase 3 status: UI-complete** (all five screens built with mock-backed queries; `pnpm typecheck` passes). Real operations land in Phase 6.

---

## Phase 4 — Advanced screens

- [x] `/maintenance` — Overview (CPU/memory/disk activity/temperature *where supported*), Startup, Applications, Disk Health with source & limitations. Mock-backed; unsupported metrics show "Not available"; startup changes are explicitly disabled in the preview.
- [ ] `/automation` — Scheduled Tasks / History, task cards, task editor, always-disable guarantee
- [ ] `/reports` — recovered/duplicates/organized metrics, storage growth chart, activity timeline, recommendations
- [ ] `/settings` — General, Appearance, Notifications, Cleanup, Organization, Storage, Privacy, License. The Updates section arrives with native persistence in 6.6.
- [ ] License and plan + Help entry points from sidebar

**Exit criteria:** no unsupported metric presented as a measurement; scheduled actions can always be disabled; settings explain consequences.

**Phase 4 status: in progress** — `/maintenance` UI-complete; the remaining screens still render placeholders. All Phase 4 data is mock-backed until Phase 6.

---

## Phase 5 — Polish (UI)

Visual, interaction, and accessibility polish. These checks do not require real data and are done before native integration. Permission, drive-unavailable, and partial-scan states are re-audited in Phase 6.7 against real hardware.

- [ ] Dark theme audit (equal polish to light)
- [ ] Keyboard shortcuts + focus management
- [ ] Accessibility pass (contrast, screen readers, dialogs, reduced motion)
- [ ] Loading, empty, error, permission, drive-unavailable states on every screen
- [ ] Responsive window behavior (1440+ / 1100–1439 / 900–1099)
- [ ] Micro-interactions using spec durations (120/100/140/180/180/200ms)
- [ ] Quality checklist sign-off from `Spec.md` Part IX (visual/UX items)

Windows installer and OTA verification have moved to Phase 7.

---

## Phase 6 — Native integration

Goal: replace mock data with real Tauri commands, surface by surface, without changing the UI contracts established in Phases 3–5. Every command lands with its capability grant, validation, error mapping, and a state the UI already knows how to render. A screen is only **product-complete** at the end of this phase.

### 6.0 Contracts and safety rails

- [ ] Request/response schemas (Zod) for every command; replace the `notImplemented` signatures in `lib/native/client.ts` with typed operations
- [ ] Standard error envelope (code, message, recoverability, details) mapped to user-facing copy
- [ ] Progress + cancellation protocol for long scans (`disk.analyze`, `duplicates.scan`) using job ids and Tauri events
- [ ] Path-safety rules: canonicalize paths, reject traversal outside the selected root, do not follow reparse points without explicit opt-in
- [ ] Capability grants added per command as it lands, never pre-emptively
- [ ] Rule: unsupported attributes or operations render as "Not available" rather than a fabricated value

### 6.1 Disk and filesystem

- [ ] `disk.list` — drives, capacity, free space, filesystem, removable/network flags
- [ ] `disk.analyze` — async directory walk with progress, cancellation, partial results, and size aggregation by folder and file type
- [ ] `files.list` / `files.inspect` — directory listing, metadata, reveal/open through the scoped shell grant
- [ ] Swap Overview and Disk Analysis hooks from `mock-*` to `nativeApi`

### 6.2 Cleanup and quarantine

- [ ] `cleanup.preview` — exact files and sizes from real locations
- [ ] `cleanup.execute` — move to Recycle Bin or ZenDisk quarantine, returning per-file results
- [ ] Restore/undo for quarantined items; persist every operation in history
- [ ] Re-verify the destructive path end to end: preview → explicit confirmation → result → history

### 6.3 Organization and duplicates

- [ ] `organizer.preview` / `organizer.execute` with conflict detection, dry-run, and undo where the filesystem allows
- [ ] `duplicates.scan` with streaming hashes, progress, and cancellation; never auto-delete on hash match
- [ ] Reuse the 6.2 quarantine for duplicate removal

### 6.4 Maintenance

- [ ] `system.metrics` — CPU, memory, and disk activity via `sysinfo`; temperature only when the device exposes it
- [ ] `startup.list` / `startup.set` — list entries plus enable/disable with explicit confirmation and a revert path
- [ ] `apps.list` — installed applications, publisher, version, install date, estimated size, and data source
- [ ] `disk.health` — best-effort SMART attributes per drive, carrying source and limitations in the payload

### 6.5 Automation and reports

- [ ] `automation.*` — CRUD, enable/disable, run-now, next-run; decide between Windows Task Scheduler (survives exit) and an in-app scheduler (only while open) and document the limitation
- [ ] `automation.history` — persisted runs with outcomes and errors
- [ ] `operations.history` + `reports.summary` — real aggregates for the Reports screen

### 6.6 Settings, persistence, and updates

- [ ] Persist preferences through the `store` plugin: theme, density, notification preferences, cleanup/organization defaults
- [ ] Settings sections read and write real preferences and explain consequences
- [ ] Updates section: current version, "Check for updates", download/install progress, relaunch prompt
- [ ] Verify preference and history migration across an app update

### 6.7 Verification on Windows 10/11

- [ ] Every screen exercised against a real drive, including permission-denied and drive-unavailable paths
- [ ] Long scans confirmed non-blocking, with cancel and elapsed time
- [ ] Operation history and undo verified across an app restart
- [ ] Update check, download, signature verification, install, and relaunch verified against a newer CI build

### Native capability matrix

Proposed command names; update the state column as work lands. `stub` = facade exists but throws, `new` = not yet in the facade.

| Surface | Command(s) | Mechanism / grant | State |
| --- | --- | --- | --- |
| App version | `app.version` | `@tauri-apps/api/app` via `core:default` | Real |
| Update check/install | `updates.check`, `updates.install` | `updater:default`, `process:default` | Facade real; UI missing (6.6) |
| Overview drives | `disk.list` | Custom command + path scope | Stub |
| Disk analysis | `disk.analyze` | Custom command + progress events | Stub |
| Files | `files.list`, `files.inspect` | Custom command + `fs`/`shell` scope | Stub |
| Cleanup | `cleanup.preview`, `cleanup.execute` | Custom command + Recycle Bin/quarantine | Stub |
| Organization | `organizer.preview`, `organizer.execute` | Custom command + `fs` scope | Stub |
| Duplicates | `duplicates.scan` | Custom command, streaming hash | Stub |
| Activity history | `operations.history` | Custom command + `store` | Stub |
| Maintenance | `system.metrics`, `startup.list`, `startup.set`, `apps.list`, `disk.health` | Custom commands | New (6.4) |
| Automation | `automation.*`, `automation.history` | Custom commands + scheduler + `store` | New (6.5) |
| Reports | `reports.summary` | Custom command over persisted history | New (6.5) |
| License/help | — | `shell:allow-open` for external links | UI only |

---

## Phase 7 — Release readiness

- [ ] Clean Windows 10/11 install, upgrade from the previous build, and uninstall verified
- [ ] Updater end to end: detect newer build, download, signature check, install, relaunch
- [ ] Decide and document whether uninstall removes preferences, history, and quarantined files
- [ ] Authenticode signing, or an explicit and documented SmartScreen warning
- [ ] Revisit the updater key password and rotation procedure
- [ ] Stable vs. beta channel decision (the rolling `windows-latest` tag is effectively a beta channel today)
- [ ] Re-audit permission, drive-unavailable, partial-scan, and error states from Phase 5 against real data
- [ ] Part IX quality checklist signed off against real data
- [ ] Release notes / changelog practice

---

## Technical risks / open questions

1. **Drive capacity & health data.** ~~Decide before Phase 3/4.~~ Resolved: custom Rust commands in Phase 6.1/6.4. Phases 3–5 use isolated mock data behind TanStack Query; unsupported attributes render as "Not available", never a fabricated value.
2. **Startup/applications inventory.** Resolved: platform-specific custom Rust commands in Phase 6.4, with an explicit supported/unsupported state per field.
3. ~~**`nativeAllowList` scope.**~~ Resolved: replaced wildcards with an explicit method list in the old `neutralino.config.json`, then superseded by Tauri capability grants in `src-tauri/capabilities/default.json`. Keep each grant least-privilege and add scopes only when a native operation lands.
4. ~~**shadcn/ui dependency.**~~ Resolved: adopted Radix/CVA in Phase 1; all visual values remain ZenDisk tokens.
5. **Local fonts.** Still open: package Inter and IBM Plex Mono files (or self-host) rather than relying on network fonts; CSP currently allows only `data:`/`self` font sources.
6. **Native API behavior in browser preview.** `pnpm dev:web` has no Tauri IPC; use typed facade stubs/mocks for UI development rather than calling `@tauri-apps/api` or plugin packages. `useAppVersion` falls back to `0.0.0` there.
7. **Unverifiable native work from Termux.** CI can compile Rust but cannot exercise the installed app. Phase 6 work is not product-complete until it passes on Windows 10/11.
8. **Scan and hashing performance.** Directory walks and duplicate hashing can saturate I/O. Mitigate with streaming, bounded concurrency, progress, and cancellation; benchmark on a real drive.
9. **Scheduler reliability.** An in-app scheduler only runs while ZenDisk is open; Windows Task Scheduler survives exit but is harder to manage and audit. Decide in 6.5 and document the limitation in the UI.
10. **Updater key custody.** Losing `TAURI_SIGNING_PRIVATE_KEY` permanently blocks updates for installed clients. The empty-password key is acceptable only while the repository stays private; revisit in Phase 7.

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
| 2026-11-20 | Built `/maintenance` on mock data. Unsupported readings (e.g. temperature) display "Not available" with an explanation instead of a placeholder number; disk health cards list the data source and limitations. Startup changes are disabled in the preview with a note that native control is not connected. | Spec requires never presenting unsupported metrics as measurements and being transparent about capability. |
| 2026-11-20 | Extended `DataTable` with `selectable={false}` for read-only lists, and added a `maintenance` kind to `ActivityEvent` so the Maintenance tab can reuse the Overview `RecentActivity` component. | Reuse shared components instead of duplicating a selection-free table or an event list. |
| 2026-11-20 | Split delivery into three tracks: product surface (Phases 0–5), native integration (Phase 6), release readiness (Phase 7). A checked UI screen means "UI-complete", not shippable. | The spec's Part X is a UI build order written for Electron; Tauri has no main process, and the native layer had no phase. Keeps existing phase numbers and history intact. |
| 2026-11-20 | Mock data is deliberate through Phase 5. Real values only arrive in Phase 6; until then screens show a sample-data notice, and unsupported values show "Not available". | Avoids blocking UI work on native access and prevents mock numbers from being mistaken for measurements, as the spec requires. |
| 2026-11-20 | Sequencing is Phase 4 → Phase 5 UI polish → Phase 6 native → Phase 7 release. Phase 6 re-audits permission, partial-scan, and hardware states. | Visual/a11y polish does not need real data; native work cannot be verified locally. If Windows hardware becomes available sooner, Phase 6 may move ahead of Phase 5 with a second polish pass. |
| 2026-11-20 | Settings gains an **Updates** section (current version, check, install, relaunch) in Phase 6.6. | The updater exists in the runtime but postdates the spec's Settings section list, so this is a deliberate addition rather than a spec requirement. |
| 2026-11-20 | Windows install and OTA verification moved from Phase 5 to Phase 7 and marked blocked on hardware. | CI compiles and publishes but cannot exercise an installed app; claiming Phase 5 complete without it would overstate readiness. |
