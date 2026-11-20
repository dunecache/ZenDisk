# ZenDisk roadmap

Living plan for delivering ZenDisk from `Spec.md`: the UI surface, the native Tauri layer, and release readiness. Update checkboxes and the "Decisions & deviations" section as work lands.

**Current status:** Phases 0–4 complete — the product surface (nine screens plus License/Help) is **UI-complete on mock data**; real native operations begin in Phase 6. `pnpm typecheck` passes and Windows CI publishes a signed NSIS `setup.exe` with `.sig` and `latest.json` to the rolling `windows-latest` pre-release. Phase 4 passed independent verification (senior verifier PASS; specialist follow-ups tracked below). Phase 5 is in progress: fonts, shortcuts, responsive bands, contrast tokens and focus cues are done; runtime a11y review, full state coverage and Part IX sign-off remain.

**Runtime:** Tauri v2 (spec originally said Electron, then Neutralinojs; see `Spec.md` §32 / `AGENTS.md` / `docs/tauri-v2-migration.md`). Windows 10/11 only.

## Delivery tracks

The spec's Part X build order covers the **product surface** only. Tauri has no Electron main process, so the native layer and release work need their own phases. Phase numbers 0–5 are kept as-is to preserve history; 6 and 7 are added.

| Track | Phases | Definition of done |
| --- | --- | --- |
| Product surface | 0–5 | Layout, tokens, both themes, interactive flows, and loading/empty/error/partial states. Data may be mock-backed. A checked screen here means **UI-complete**, not shippable. |
| Native integration | 6 | A typed operation in `src/renderer/lib/native/client.ts`, a least-privilege grant in `src-tauri/capabilities/default.json`, validated inputs/outputs, progress/cancellation where relevant, persistence, a recorded verification level (`implemented` → `CI-verified` → `hardware-verified`), and no screen claiming a capability it lacks. |
| Release readiness | 7 | Signed installer, updater channel, clean Windows 10/11 install/upgrade/uninstall, and the spec's Part IX checklist verified against real data. |

**Sequencing:** finish Phase 4 → Phase 5 UI polish → Phase 6 native → Phase 7 release. Phase 6 introduces real permission, partial-scan, and hardware states, so those are re-audited there. If Windows 10/11 hardware is available earlier, Phase 6 can move ahead of Phase 5; it would then require a second, real-data polish pass.

## Runtime migration to Tauri v2 ✅ (install/OTA verification pending Phase 7)

- [x] Foundation swap: deps/scripts, Rust crate, `tauri.conf.json`, capabilities, generated icons; `neutralino.config.json` removed
- [x] Renderer boundary: Tauri Vite config, `HashRouter`, facade with real app version, browser-preview fallback
- [x] Plugins registered; grants later tightened to what the facade uses (`core`, `updater`, `process`). `fs`, `shell`, `dialog`, `os`, and `store` registrations remain ungranted until their Phase 6 commands land.
- [x] Signing key generated in a temporary CI workflow, stored as `TAURI_SIGNING_PRIVATE_KEY`, keygen runs deleted
- [x] Windows CI rewritten: signed NSIS `setup.exe` + `.sig` + `latest.json` published to the rolling `windows-latest` pre-release
- [x] Docs aligned; local `pnpm typecheck`, PR CI, and main CI all green
- [x] Rotate the updater key to a password-protected key and set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (2026-11-20, before any real installs). CI build `44818030760` signed the new installer with the new key; the `0.1.15` `.sig` key id matches the committed public key.
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
- [x] `/automation` — Scheduled Tasks / History, task cards, task editor, always-disable guarantee. Mock-backed; the enable/disable switch is always available, execution is limited to quarantine/report, and run history shows partial/failed/cancelled outcomes.
- [x] `/reports` — recovered/duplicates/organized metrics, storage growth chart with readable axes/legend/tooltips, activity timeline, and evidence-based recommendations. Mock-backed with 7/30/90-day range filtering.
- [x] `/settings` — General, Appearance, Notifications, Cleanup, Organization, Storage, Privacy, License. All eight sections are implemented with local preferences; Confirmation and Preview-before-apply are locked on. The Updates section arrives with native persistence in 6.6.
- [x] License and plan + Help entry points from sidebar — both routes now render real screens (plan status, common questions, shortcuts); the router no longer uses `PlaceholderScreen` for any Phase 4 path.

**Exit criteria:** no unsupported metric presented as a measurement; scheduled actions can always be disabled; settings explain consequences.

**Phase 4 status: UI-complete** — all four advanced screens and the License/Help entry points are implemented on mock data. Real operations land in Phase 6.

---

## Phase 5 — Polish (UI)

Visual, interaction, and accessibility polish. These checks do not require real data and are done before native integration. Permission, drive-unavailable, and partial-scan states are re-audited in Phase 6.7 against real hardware.

- [ ] Dark theme audit (equal polish to light) — dark tokens already pass static contrast checks; visual review still pending
- [x] Keyboard shortcuts + focus management — all Spec §34 shortcuts wired in `AppShell`; input-focus guard moved ahead of every handler; Ctrl+K opens a destination search dialog
- [ ] Accessibility pass (contrast, screen readers, dialogs, reduced motion) — light-theme tokens darkened to AA, danger/error alerts now `role="alert"`, menu focus ring, labeled collapsed brand, focus rings on retry links; runtime screen-reader check pending
- [ ] Loading, empty, error, permission, drive-unavailable states on every screen — Phase 4 screens complete; Phase 3 denied/partial states tracked in Verification follow-ups
- [x] Responsive window behavior (1440+ / 1100–1439 / 900–1099) — `compact`/`desktop` breakpoints added and the sidebar auto-collapses below 1100px
- [x] Micro-interactions using spec durations (120/100/140/180/180/200ms) — all transitions consume the existing motion tokens
- [x] Self-host fonts via `@fontsource-variable/inter` and `@fontsource/ibm-plex-mono` (latin, weights 400/500), `font-display: swap`, `system-ui` fallback; CSP unchanged, tabular numbers use Inter via `font-variant-numeric`
- [ ] Quality checklist sign-off from `Spec.md` Part IX (visual/UX items) — pending Phase 5 verifier

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
- [ ] Platform logic in pure Rust modules (WMI/PowerShell and registry parsing, hashing) with recorded fixtures, so it can be unit-tested off Windows
- [ ] `zendisk --smoke` mode: run real commands against a temp directory and print a JSON report; a `windows-latest` job also performs a silent NSIS install, launch, and uninstall
- [ ] Record a verification level for every native item: `implemented` → `CI-verified` → `hardware-verified`
- [ ] SQLite for operation and run history, shared by the UI and headless runs (WAL mode + busy timeout)
- [ ] Performance rules: Rust aggregates; progress at most every ~200 ms; depth-limited tree plus top-N lists, never per-file IPC events
- [ ] Walk with a bounded pool `min(cores, 8)`, cancel via `AtomicBool`, and use directory-entry metadata to avoid an extra stat per file
- [ ] Duplicate pipeline: group by size → partial hash of head and tail → full BLAKE3 only on collisions; 2–4 hashers, 1 on HDDs
- [ ] Benchmark target: 500k files scanned without dropped UI frames

### 6.1 Disk and filesystem

- [ ] `disk.list` — drives, capacity, free space, filesystem, removable/network flags
- [ ] `disk.analyze` — async directory walk that aggregates in Rust, emits progress at most every ~200 ms, and returns a depth-limited tree plus top-N lists with partial-result and cancellation support
- [ ] `files.list` / `files.inspect` — directory listing, metadata, reveal/open through the scoped shell grant
- [ ] Swap Overview and Disk Analysis hooks from `mock-*` to `nativeApi`

### 6.2 Cleanup and quarantine

- [ ] `cleanup.preview` — exact files and sizes from real locations
- [ ] `cleanup.execute` — move to Recycle Bin or ZenDisk quarantine, returning per-file results
- [ ] Restore/undo for quarantined items; persist every operation in history
- [ ] Re-verify the destructive path end to end: preview → explicit confirmation → result → history

### 6.3 Organization and duplicates

- [ ] `organizer.preview` / `organizer.execute` with conflict detection, dry-run, and undo where the filesystem allows
- [ ] `duplicates.scan` using the size → head/tail partial hash → BLAKE3 pipeline, with progress and cancellation; never auto-delete on hash match
- [ ] Reuse the 6.2 quarantine for duplicate removal

### 6.4 Maintenance

- [ ] `system.metrics` — CPU, memory, and disk activity via `sysinfo`; temperature only when the device exposes it
- [ ] `startup.list` / `startup.set` — list entries plus enable/disable with explicit confirmation and a revert path
- [ ] `apps.list` — installed applications, publisher, version, install date, estimated size, and data source
- [ ] `disk.health` — best-effort SMART attributes per drive, carrying source and limitations in the payload

### 6.5 Automation and reports

- [ ] `automation.*` — CRUD, enable/disable, run-now, next-run; per-user Windows Task Scheduler tasks in a `\ZenDisk\` folder invoke `zendisk.exe --run-task <id>` headless with no admin rights
- [ ] Treat Task Scheduler as the source of truth for the UI: read real state, disable via `/Change /DISABLE`, and remove `\ZenDisk\` tasks in the uninstaller
- [ ] Enable "start when available" to catch up missed runs; document that tasks only run while the user is logged on
- [ ] Scheduled actions may only quarantine items, never permanently delete
- [ ] `automation.history` — runs with outcomes and errors persisted in SQLite (not the `store` plugin), because headless runs and the open app can write concurrently
- [ ] `operations.history` + `reports.summary` — real aggregates for the Reports screen

### 6.6 Settings, persistence, and updates

- [ ] Persist preferences through the `store` plugin: theme, density, notification preferences, cleanup/organization defaults
- [ ] Settings sections read and write real preferences and explain consequences
- [ ] Updates section: current version, "Check for updates", download/install progress, relaunch prompt
- [ ] Verify preference and history migration across an app update

### 6.7 Verification levels

CI-verified (automated, `windows-latest` VM):

- [ ] `zendisk --smoke` green for every command against a temp directory
- [ ] Silent NSIS install, launch, and uninstall complete without errors
- [ ] Unit tests for the pure platform-parsing modules run against recorded fixtures

Hardware-verified (manual, Windows 10/11 with real drives):

- [ ] Every screen exercised against a real drive, including permission-denied and drive-unavailable paths
- [ ] Long scans confirmed non-blocking, with cancel and elapsed time; 500k-file benchmark meets the no-dropped-frames target
- [ ] Operation history and undo verified across an app restart
- [ ] SMART and permission paths verified; the "Not available" fallback confirmed where a drive reports nothing
- [ ] Update check, download, signature verification, install, and relaunch verified against a newer CI build

### Native capability matrix

Proposed command names; update the state column as work lands. States: `stub` (facade exists but throws) → `implemented` → `CI-verified` → `hardware-verified`; `new` = not yet in the facade.

| Surface | Command(s) | Mechanism / grant | State |
| --- | --- | --- | --- |
| App version | `app.version` | `@tauri-apps/api/app` via `core:default` | Implemented; not hardware-verified |
| Update check/install | `updates.check`, `updates.install` | `updater:default`, `process:default` | Implemented; UI missing (6.6); not hardware-verified |
| Overview drives | `disk.list` | Custom command + path scope | Stub |
| Disk analysis | `disk.analyze` | Custom command + progress events | Stub |
| Files | `files.list`, `files.inspect` | Custom command + `fs`/`shell` scope | Stub |
| Cleanup | `cleanup.preview`, `cleanup.execute` | Custom command + Recycle Bin/quarantine | Stub |
| Organization | `organizer.preview`, `organizer.execute` | Custom command + `fs` scope | Stub |
| Duplicates | `duplicates.scan` | Custom command, streaming hash | Stub |
| Activity history | `operations.history` | Custom command + SQLite | Stub |
| Maintenance | `system.metrics`, `startup.list`, `startup.set`, `apps.list`, `disk.health` | Custom commands | New (6.4) |
| Automation | `automation.*`, `automation.history` | Custom commands + Task Scheduler + SQLite | New (6.5) |
| Reports | `reports.summary` | Custom command over persisted history | New (6.5) |
| License/help | — | None; external-link opening not connected | UI only |

---

## Phase 7 — Release readiness

- [x] Rotate to a password-protected updater key **before the first real install**: set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, update the committed public key, and verify a signed build
- [ ] Back up the updater private key and password in a password manager plus one offline copy (**user action** — GitHub secrets cannot be read back)
- [x] Document the bridge-release rotation procedure: the old key signs a release that ships the new public key (`docs/updater-key-rotation.md`)
- [ ] Clean Windows 10/11 install, upgrade from the previous build, and uninstall verified; the uninstaller removes `\ZenDisk\` scheduled tasks
- [ ] Updater end to end (manual, real hardware): detect newer build, download, signature check, install, relaunch
- [ ] Decide and document whether uninstall removes preferences, history, and quarantined files
- [ ] Authenticode signing, or an explicit and documented SmartScreen warning
- [ ] Stable vs. beta channel decision (the rolling `windows-latest` tag is effectively a beta channel today)
- [ ] Re-audit permission, drive-unavailable, partial-scan, and error states from Phase 5 against real data
- [ ] Part IX quality checklist signed off against real data
- [ ] Release notes / changelog practice

---

## Verification follow-ups (senior + specialist reviews, 2026-11-20)

These are tracked, not silently deferred. Phase 4 passed senior verification; these items are inputs to later phases.

**Phase 5 — polish/a11y/responsive**

- [ ] Raise light-theme `--muted` and semantic status text to WCAG AA (≥4.5:1) on surface/background and tinted backgrounds; check `--danger-foreground` on `--danger` (design auditor findings 1–3)
- [ ] Use `role="alert"` for danger/error `InlineAlert` and `Toast` variants (finding 4)
- [ ] Wire Ctrl+K, Ctrl+F, Ctrl+R and Delete handlers; move the input-focus guard ahead of all shortcuts (findings 5–6)
- [ ] Add the specified 1100–1439 and 900–1099 breakpoints and auto-collapse the sidebar below 1100px (finding 7)
- [ ] Accessible name for collapsed brand link; focus-visible styling for bare "Try again" buttons; stronger menu focus indicator (findings 10–12)
- [ ] Label partially populated report periods instead of silently filtering (finding 9)
- [ ] Extend permission-denied and partial states to the Phase 3 screens (finding 15)

**Phase 6 — native/performance/safety**

- [ ] Hash contract needs `algorithm` and verification level (`size`/`partial`/`full`); `HashDetailsDialog` must not claim content verification for size-only groups (performance reviewer §2.5)
- [ ] Progress/job/cancel protocol in the facade; selector-based progress store and memoized subtrees before wiring ~5 events/s (§2.3–2.4)
- [ ] Virtualize `FileList` and duplicates group list; enforce top-N native payloads (§2.1, 2.6)
- [ ] Add range to `reportsKeys` and memoize the cutoff when `reports.summary(range)` lands (§2.2)
- [ ] Benchmark harness (`criterion` + `--bench-scan`), ratify the 500k-file/≤16.7ms frame targets (§1 and §4)
- [ ] Path safety, per-file results, SQLite-backed history, accessible history UI, and privacy "clear history on exit" wiring (adversarial findings 3, 6 and cross-cutting history issues)
- [ ] Remove ungranted plugin registrations from `lib.rs` until Phase 6 needs them; define the standard error envelope with the first command (security reviewer observations)
- [ ] CI smoke job on `windows-latest`: `--smoke`, silent NSIS install, launch, uninstall, failing the build on error
- [ ] NSIS uninstaller removes `\ZenDisk\` scheduled tasks; verify headless run cannot permanently delete

**Phase 7 — release/user action**

- [ ] Confirm the `windows-latest` release and all three assets are publicly reachable; verify re-run version collisions, cached-manifest/asset-deletion races, and concurrent-run publish ordering
- [ ] User action: back up the updater key and password in a password manager plus one offline copy
- [ ] Authenticode certificate decision and stable/beta channel decision

---

## Technical risks / open questions

Items #1–5 and #7–10 are resolved below; #6 remains a known limitation rather than a blocker. Risk #10 still has one user action (offline key/password backup) tracked in Phase 7.

1. **Drive capacity & health data.** ~~Decide before Phase 3/4.~~ Resolved: custom Rust commands in Phase 6.1/6.4. Phases 3–5 use isolated mock data behind TanStack Query; unsupported attributes render as "Not available", never a fabricated value.
2. **Startup/applications inventory.** Resolved: platform-specific custom Rust commands in Phase 6.4, with an explicit supported/unsupported state per field.
3. ~~**`nativeAllowList` scope.**~~ Resolved: replaced wildcards with an explicit method list in the old `neutralino.config.json`, then superseded by Tauri capability grants in `src-tauri/capabilities/default.json`. Keep each grant least-privilege and add scopes only when a native operation lands.
4. ~~**shadcn/ui dependency.**~~ Resolved: adopted Radix/CVA in Phase 1; all visual values remain ZenDisk tokens.
5. **Local fonts.** Resolved: bundle `@fontsource-variable/inter` and `@fontsource/ibm-plex-mono` (latin, weights 400/500) as same-origin woff2 assets, so the CSP stays `self`/`data:`. Use `font-display: swap` with a `system-ui` fallback; Inter's `tnum` feature covers tabular numbers. Phase 5.
6. **Native API behavior in browser preview.** Known limitation: `pnpm dev:web` has no Tauri IPC; use typed facade stubs/mocks for UI development rather than calling `@tauri-apps/api` or plugin packages. `useAppVersion` falls back to `0.0.0` there.
7. **Unverifiable native work from Termux.** Resolved by two verification levels. Pure Rust modules are tested with recorded PowerShell/WMI JSON and registry fixtures; a `--smoke` mode runs the real commands against a temp directory on `windows-latest`, together with a silent NSIS install, launch, and uninstall. Items move from `implemented` to `CI-verified`, then `hardware-verified`. Only OTA and SMART/permission paths stay manual because runners are VMs.
8. **Scan and hashing performance.** Resolved by design: Rust aggregates and emits progress at most every ~200 ms as a depth-limited tree plus top-N lists, never per-file events. Walk with a pool of `min(cores, 8)`, cancel via `AtomicBool`, and read directory-entry metadata to avoid extra stats. Duplicates: size groups → head/tail partial hash → full BLAKE3 on collisions, with 2–4 hashers (1 on HDDs). Target: 500k files with no dropped UI frames.
9. **Scheduler reliability.** Resolved: per-user Windows Task Scheduler tasks in `\ZenDisk\` run `zendisk.exe --run-task <id>` headless without admin rights. The Scheduler is the UI's source of truth, disable uses `/Change /DISABLE`, and the uninstaller removes the tasks. "Start when available" catches missed runs; tasks only run while the user is logged on. Scheduled actions may only quarantine, never permanently delete. Run history lives in SQLite because headless and UI runs can write concurrently.
10. **Updater key custody.** Rotated on 2026-11-20 before any real installs; CI signing verified and the bridge-release procedure is documented in `docs/updater-key-rotation.md`. Remaining action: the user must copy the key and password into a password manager plus one offline copy, because GitHub secrets cannot be read back.

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
| 2026-11-20 | Updater signing key generated in a temporary `ubuntu-latest` workflow (artifact storage quota was hit, so keys were printed to a private run log) and imported via `gh secret set TAURI_SIGNING_PRIVATE_KEY`. All keygen runs deleted. Public key committed in `tauri.conf.json`. | Tauri requires minisign signatures; the secret must never be committed. The key was initially created with an empty password; superseded by the password-protected rotation decision below. |
| 2026-11-20 | CI injects `0.1.<github.run_number>` on main and `0.0.<run_number>` on PRs via `--config`; `createUpdaterArtifacts` is disabled on PRs. | Updater ignores equal versions; a static `0.0.0` would never update. PRs have no signing secret. |
| 2026-11-20 | Published assets: NSIS `setup.exe`, `.sig`, and `latest.json`, uploaded in that order to the rolling `windows-latest` pre-release; old `zendisk-release.zip` removed. | Avoids quota-limited Actions artifacts; the manifest is last so clients never see a signature for a missing asset. |
| 2026-11-20 | Built `/maintenance` on mock data. Unsupported readings (e.g. temperature) display "Not available" with an explanation instead of a placeholder number; disk health cards list the data source and limitations. Startup changes are disabled in the preview with a note that native control is not connected. | Spec requires never presenting unsupported metrics as measurements and being transparent about capability. |
| 2026-11-20 | Extended `DataTable` with `selectable={false}` for read-only lists, and added a `maintenance` kind to `ActivityEvent` so the Maintenance tab can reuse the Overview `RecentActivity` component. | Reuse shared components instead of duplicating a selection-free table or an event list. |
| 2026-11-20 | Split delivery into three tracks: product surface (Phases 0–5), native integration (Phase 6), release readiness (Phase 7). A checked UI screen means "UI-complete", not shippable. | The spec's Part X is a UI build order written for Electron; Tauri has no main process, and the native layer had no phase. Keeps existing phase numbers and history intact. |
| 2026-11-20 | Mock data is deliberate through Phase 5. Real values only arrive in Phase 6; until then screens show a sample-data notice, and unsupported values show "Not available". | Avoids blocking UI work on native access and prevents mock numbers from being mistaken for measurements, as the spec requires. |
| 2026-11-20 | Sequencing is Phase 4 → Phase 5 UI polish → Phase 6 native → Phase 7 release. Phase 6 re-audits permission, partial-scan, and hardware states. | Visual/a11y polish does not need real data; native work cannot be verified locally. If Windows hardware becomes available sooner, Phase 6 may move ahead of Phase 5 with a second polish pass. |
| 2026-11-20 | Settings gains an **Updates** section (current version, check, install, relaunch) in Phase 6.6. | The updater exists in the runtime but postdates the spec's Settings section list, so this is a deliberate addition rather than a spec requirement. |
| 2026-11-20 | Windows install and OTA verification moved from Phase 5 to Phase 7 and marked blocked on hardware. | CI compiles and publishes but cannot exercise an installed app; claiming Phase 5 complete without it would overstate readiness. |
| 2026-11-20 | Self-host fonts from npm: `@fontsource-variable/inter` and `@fontsource/ibm-plex-mono` (latin, 400/500), `font-display: swap`, `system-ui` fallback. Add the packages and lockfile in Phase 5. | Same-origin woff2 keeps the CSP at `self`/`data:` with no network fonts; Inter's `tnum` satisfies the tabular-numbers rule. |
| 2026-11-20 | Native work has two verification levels: `CI-verified` (pure modules with recorded fixtures, plus `--smoke` and silent NSIS install/launch/uninstall on `windows-latest`) and `hardware-verified` (human on Windows 10/11). Only OTA and SMART/permission paths stay manual. | CI can prove most behavior without overstating readiness; VM runners cannot exercise real SMART data or the interactive installer UX. |
| 2026-11-20 | Scan/hash design: Rust aggregates, progress every ~200 ms, depth-limited tree + top-N, no per-file IPC; bounded walk pool `min(cores, 8)`, `AtomicBool` cancel, directory-entry metadata; duplicates size → head/tail partial hash → BLAKE3, 2–4 hashers (1 on HDD). Benchmark target: 500k files with no dropped UI frames. | IPC volume, not CPU, is the renderer bottleneck; aggregating in Rust keeps progress meaningful and the UI responsive. |
| 2026-11-20 | Automation uses per-user Windows Task Scheduler tasks in `\ZenDisk\`, invoking `zendisk.exe --run-task <id>` headless. Scheduler is the source of truth; disable via `/Change /DISABLE`; uninstaller removes tasks; "start when available"; runs only while logged on; scheduled actions quarantine only; history in SQLite. | Survives app exit without admin rights and matches the recoverability rule. SQLite handles concurrent headless and UI writes, which the `store` plugin does not. |
| 2026-11-20 | Rotate the updater key to a password-protected key now, before any real installs; add `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`, update the public key, back up key and password offline, and document bridge-release rotation. | Installed clients pin the public key, so rotating later needs a bridge release. No installs exist yet, so this is the cheapest moment. Phase 7 docs. |
| 2026-11-20 | Built `/automation` on mock data: task cards with an always-available enable/disable switch, a task editor limited to quarantine-only or report-only execution, and run history with partial/failed/cancelled outcomes. The switch stays interactive when access is denied; edits go through a TanStack Query mutation against the mock cache, not a parallel local copy. Preview edits are not written to operation history. | Spec requires that scheduled actions can always be disabled and that destructive operations remain recoverable. AGENTS.md requires application data to stay in TanStack Query; operation history is an audit trail for real operations only. |
| 2026-11-20 | Built `/reports` on mock data with a 7/30/90-day selector. Reused `MetricCard`, `RecentActivity`, and `RecommendationList`; added a local SVG storage-growth chart with axis labels, legend, SVG point tooltips, and an `sr-only` data table. | Spec asks for meaningful charts with readable labels, legends, and tooltips; reusing existing components avoids visual inconsistencies. |
| 2026-11-20 | Built `/settings` with eight sections and a searchable section list. Preferences persist locally in a new Zustand store (`zendisk-preferences`) until Phase 6 moves them to the Tauri store plugin. Confirmation before deletion and preview-before-apply are shown as locked-on. Telemetry is off by default. | Spec requires grouped forms that explain consequences; safety controls must never be presented as optional. The Updates section is deferred to 6.6 as previously decided. |
| 2026-11-20 | Browser preview remains a known limitation: `pnpm dev:web` has no Tauri IPC, keeps the `0.0.0` version fallback, and uses facade mocks. Mock permission states can be exercised with `?access=denied` in the browser preview (with HashRouter, append it after the hash, e.g. `#/automation?access=denied`). | Preserves fast UI iteration without pretending native operations work in a browser; makes the implemented permission-denied states reachable for review. |
| 2026-11-20 | Tightened `capabilities/default.json` to `core`, `updater`, and `process` only. `fs`, `shell`, `dialog`, `os`, and `store` grants are deferred to the Phase 6 commit that lands the matching command. | Verifier found the migrated grants broader than the facade surface; least privilege is a non-negotiable rule. |
| 2026-11-20 | The "Show sample-data notices" preference now gates the preview banners on Maintenance, Automation, and Reports. | Verifier found an inert control; a setting must change something visible. |
| 2026-11-20 | Committed `apps/desktop/src-tauri/Cargo.lock` (generated during Rust verification). The Tauri crate is an application, so a committed lockfile makes Windows CI builds reproducible. | Verifier's `cargo metadata --locked` passed and the subsequent Windows CI build was green. |
| 2026-11-20 | Destructive-flow safety: duplicate selection now always keeps one copy per group; organization conflicts are excluded from the default selection, filtered on apply, and confirmed in a dialog; cleanup confirms a recoverable quarantine move instead of permanent deletion; cleanup mock file counts now match the files shown in review. | Adversarial review found pre-wired paths that could apply conflicts or quarantine every copy once native commands land. Spec rule 7 and the recoverability decision require these guards. |
| 2026-11-20 | Publishing steps now require `github.ref == 'refs/heads/main'` in addition to "not a pull request", so a manual dispatch from another ref cannot rewrite `latest.json`. | CI reviewer found that an unrestricted `workflow_dispatch` could publish an update that installed clients would reject. |
| 2026-11-20 | Specialist findings are recorded in a dedicated "Verification follow-ups" section with Phase 5/6/7 owners rather than silently deferred. | Keeps the phase gate honest: Phase 4 passed senior verification, and known a11y/performance/release gaps remain visible. |
| 2026-11-20 | Phase 5 fonts: added `@fontsource-variable/inter@^5.3.0` and `@fontsource/ibm-plex-mono@^5.3.0` to `apps/desktop/package.json` and the pnpm lockfile; imported their CSS in `globals.css` and switched `--font-interface` to `Inter Variable`. | Same-origin woff2 keeps the CSP at `self`/`data:`; `font-display: swap` comes from the packages and the system-ui fallback remains. |
| 2026-11-20 | Light-theme token adjustments: `--muted`, `--secondary`, `--success`, `--warning`, `--danger`, `--info` darkened for WCAG AA; error feedback uses `role="alert"`; menu items and retry links gained visible focus rings; collapsed brand link got an accessible name. | Design auditor measured sub-4.5:1 contrast and missing focus cues; tokens are the only place colors may change, and both themes keep the same token names. |
