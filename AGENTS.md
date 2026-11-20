# AGENTS.md — ZenDisk repository instructions

Instructions for any developer or coding agent working in this repository. Read this file before making changes.

## Source of truth

| File | Authority |
| --- | --- |
| `Spec.md` | Design system, UX, screens, interactions, and acceptance criteria. Authoritative for all UI decisions. |
| `ROADMAP.md` | Implementation phases, current status, and definition of done. |
| `README.md` | Setup, commands, and high-level architecture. |
| `apps/desktop/src-tauri/tauri.conf.json` | Tauri runtime configuration, bundle settings, updater endpoints. |
| `apps/desktop/src-tauri/capabilities/default.json` | Native command and plugin permission grants (least privilege). |
| `apps/desktop/src/renderer/styles/tokens.css` | Semantic design tokens (the only place colors are defined). |

If a document conflicts with the code, update the document or the code deliberately — never leave both silently disagreeing.

## Runtime correction to the spec

The original specification names **Electron** as the desktop platform. ZenDisk's desktop shell is now **Tauri v2** (`@tauri-apps/api` + `@tauri-apps/cli` + a Rust crate in `apps/desktop/src-tauri/`). Everything in `Spec.md` about design, layout, components, behavior, and quality still applies. Only the "Electron boundary" concept (§32) is superseded: there is no main/preload process. The equivalent boundary is the typed facade at `apps/desktop/src/renderer/lib/native/`, backed by Tauri commands and plugin permissions.

Never reintroduce Electron, `main/`, `preload/`, `electron-vite`, or Neutralinojs.

Windows 10/11 are the supported desktop targets. Windows 7 is not achievable with this stack (Rust's MSVC targets and current WebView2 both require Windows 10+); see `docs/tauri-v2-migration.md`.

## Current state

Phases 0–4 are complete: design tokens, shared components, desktop shell, five main screens, four advanced screens, and the License/Help entry points are implemented on mock data behind TanStack Query. All screens are mock-backed until Phase 6 native integration (`ROADMAP.md`). A screen being checked in Phases 0–5 means UI-complete, not product-complete. Check before importing a component — an existing folder does not guarantee an implementation.

## Repository layout

```
apps/desktop/                     Tauri app + React renderer
  src-tauri/                      Rust crate, tauri.conf.json, capabilities, icons
  vite.config.ts                  root: src/renderer, out: dist/
  src/renderer/
    app/                          App.tsx, router.tsx, providers/
    components/
      ui/, layout/, navigation/, forms/, feedback/,
      file-system/, disk/, cleanup/, organizer/,
      duplicates/, maintenance/, automation/
      data-display/               tables/, metrics/, charts/, storage/
    features/
      overview/components/        dashboard/, quick-actions/, activity/, recommendations/
      disk-analysis/components/   treemap/, breakdown/, scan/, largest-files/, folders/
      cleanup/components/         tabs/, results/, review/, summary/
      organization/components/    rule-builder/, rule-list/, preview/, templates/, history/
      duplicates/components/      groups/, filters/, comparison/, quarantine/
      maintenance/components/     overview/, startup/, applications/, disk-health/
      automation/components/      tasks/, editor/, history/
      reports/components/         charts/, timeline/, metrics/, recommendations/
      settings/components/        sections/{general,appearance,notifications,cleanup,
                                  organization,storage,privacy,license}/
    hooks/                        data/ (TanStack Query), ui/, filesystem/
    lib/                          formatters/, validators/, utils/, native/
    stores/                       ui/, preferences/, operations/ (Zustand)
    styles/                       tokens.css, themes.css, typography.css,
                                  components.css, globals.css, fonts/
    types/                        domain/, api/, native/

Empty subfolders contain `.gitkeep` placeholders; all Phase 3 and Phase 4 feature folders are implemented.
packages/shared/                  Framework-agnostic types, API contracts, constants
packages/core/                    Reserved domain services (unused by renderer)
packages/ui/                      Reusable design-system primitives
```

## Commands

```bash
pnpm install          # install workspace dependencies
pnpm dev              # tauri dev: Vite HMR + Tauri window
pnpm dev:web          # Vite dev server only (browser preview, no native API)
pnpm build            # vite build -> apps/desktop/dist
pnpm build:app        # tauri build -> NSIS installer (Windows)
pnpm typecheck        # typecheck all packages
```

Do not add, remove, or upgrade a dependency without updating the relevant `package.json`, the lockfile, and noting it in `ROADMAP.md`. Tauri CLI binaries are only available on desktop hosts; on Termux use `pnpm dev:web` and `pnpm typecheck` (CI performs Rust builds).

## Non-negotiable rules

1. **Native access goes through one boundary.** Components and features must never import `@tauri-apps/api` or `@tauri-apps/plugin-*` directly. Add a typed, validated method to `src/renderer/lib/native/client.ts` instead. Keep grants in `src-tauri/capabilities/default.json` at least privilege.
2. **No hardcoded colors.** Use CSS variables from `tokens.css` / `themes.css`. Never introduce a new color without adding a semantic token in both themes.
3. **No inline styles for design values.** Spacing, radius, typography, motion, and elevation come from tokens. Inline styles are acceptable only for genuinely dynamic values (e.g., a measured width).
4. **Both themes are mandatory.** Any new component must be reviewed in warm light and deep botanical dark.
5. **Reuse before creating.** Extend an existing shared component instead of building a visually inconsistent twin. If a primitive is missing, add it to `components/ui/` (or `packages/ui/` if truly cross-app) using token-driven styles.
6. **Design all states.** Every screen and data component needs loading, empty, no-results, partial, error, permission-denied, and success states. Use `Skeleton` for loading; use `EmptyState` for empty/no-results.
7. **Destructive operations require awareness.** Preview exact files, explain what/where/how many/recoverability, require explicit confirmation, and record the result in operation history. Never delete automatically because hashes match.
8. **Never block the renderer.** Long scans and file walks belong in async operations with progress, cancellation, and elapsed time. Distinguish indeterminate from measurable progress.
9. **Accessibility is part of done.** Keyboard access, visible focus, semantic HTML, labeled icon buttons, accessible dialogs, non-color status indicators, and `prefers-reduced-motion` support.
10. **Desktop-first.** Adapt density and navigation at 1100–1439px and 900–1099px; do not build a mobile-first UI.

## Component conventions

- Functional components with explicit TypeScript prop interfaces and named exports.
- Feature-specific components live under `features/<name>/components/`; shared ones under `components/<category>/`.
- shadcn/ui is adopted via `apps/desktop/components.json`. Use `cn()` from `@/lib/utils` and cva variants, but restyle everything to ZenDisk tokens. Do not treat shadcn's default look as the finish line.
- Use Lucide React icons at a consistent 16–18px. Icons never carry meaning alone.
- Use tabular numbers for storage metrics; monospace for paths, hashes, and identifiers.
- Use sentence case. No uppercase headings, no excessive bold.

## State boundaries

- **Local (React):** dialog visibility, open menus, temporary form values, local filters.
- **Shared UI (Zustand):** sidebar collapse/width, theme, selected drive, preferences, global dialogs, background-operation indicators.
- **Application data (TanStack Query):** disk info, scan results, file listings, cleanup categories, automation records, operation history. Invalidate after mutations instead of duplicating data locally.

## Working agreement for agents

- Keep changes scoped to the task; do not "helpfully" implement future phases.
- After completing work, update `ROADMAP.md` checkboxes and note any new decisions or deviations.
- When the spec is ambiguous, implement the calm, transparent, capability-preserving option and record the decision in `ROADMAP.md`.
- Prefer targeted edits over rewriting whole files.
- Do not run `pnpm install`, `git init`, or production builds unless asked.
