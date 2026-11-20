# ZenDisk — React Frontend Design System & UI Specification

> **Document control**
> - Document type: Product UI/UX and frontend implementation reference
> - Version: 1.0
> - Platform (as written): Electron desktop application
> - Frontend: React + TypeScript
> - Design language: Kanso Matcha
> - Primary theme: Warm light
> - Secondary theme: Deep botanical dark
>
> **Implementation delta (2026-11-20):** The desktop runtime for this repository is **Neutralinojs**, not Electron. All design, layout, component, interaction, and acceptance guidance below remains authoritative. Part VII §32 ("Electron boundary") is superseded by the typed native facade at `apps/desktop/src/renderer/lib/native/`, configured by `apps/desktop/neutralino.config.json`. See `AGENTS.md` and `ROADMAP.md`.

---

## PART I — DESIGN PHILOSOPHY

### 1. Product identity

ZenDisk is a desktop storage management and PC maintenance workspace.

It helps users:

- Understand their storage.
- Discover unnecessary files.
- Organize files and folders.
- Find duplicates.
- Monitor drives.
- Automate maintenance.
- Track storage changes.

It should feel like a carefully crafted productivity application rather than a conventional PC cleaner.

Core principles

**Calm**

- Minimize unnecessary visual noise.
- Avoid excessive borders and decorative elements.
- Use whitespace to establish hierarchy.

**Clarity**

- Every metric must be understandable.
- Every action must communicate its outcome.
- Every screen must have a clear purpose.

**Capability**

- Do not sacrifice advanced functionality.
- Support detailed tables, filters, batch operations, and advanced configuration.
- Use progressive disclosure rather than removing controls.

**Trust**

- Make file operations transparent.
- Preview potentially destructive operations.
- Provide clear feedback and operation history.

**Consistency**

- Reuse established components.
- Use design tokens.
- Maintain consistent interaction patterns.

Design rule

«Make the interface simple to understand, not simplistic in capability.»

---

## PART II — DESIGN SYSTEM

### 2. Color system

Use semantic design tokens rather than hardcoded colors inside components.

#### 2.1 Light theme

| Token | Hex | Purpose |
| --- | --- | --- |
| background | #F7F8F4 | Application background |
| foreground | #263B34 | Primary text |
| surface | #FFFFFF | Cards and panels |
| surface-secondary | #EEF1EA | Secondary surfaces |
| surface-tertiary | #E7EBE3 | Subtle backgrounds |
| primary | #276653 | Main actions |
| primary-hover | #205544 | Hover state |
| primary-foreground | #FFFFFF | Text on primary |
| secondary | #66877A | Secondary accents |
| accent | #A7C4A0 | Matcha highlight |
| muted | #77847D | Secondary text |
| muted-background | #F0F2EC | Muted surface |
| border | #E3E8DF | Borders |
| input | #E3E8DF | Input borders |
| focus | #789C85 | Focus ring |
| success | #4F8067 | Success |
| warning | #B58B4B | Warning |
| danger | #B66D65 | Destructive |
| info | #668AA0 | Information |

#### 2.2 Dark theme

| Token | Hex | Purpose |
| --- | --- | --- |
| background | #171D19 | Application background |
| foreground | #E8EEE8 | Primary text |
| surface | #202923 | Cards |
| surface-secondary | #28342C | Secondary surfaces |
| surface-tertiary | #303D34 | Elevated surfaces |
| primary | #8FBCA4 | Main actions |
| primary-hover | #A1CBB3 | Hover state |
| primary-foreground | #19271F | Text on primary |
| secondary | #709985 | Secondary accents |
| accent | #A7C4A0 | Matcha highlight |
| muted | #A1ADA3 | Secondary text |
| muted-background | #29342D | Muted surface |
| border | #354139 | Borders |
| input | #354139 | Input borders |
| focus | #9AC5A5 | Focus ring |
| success | #8FBCA4 | Success |
| warning | #D3AD72 | Warning |
| danger | #D48A80 | Destructive |
| info | #88ACC1 | Information |

#### 2.3 Semantic color rules

- Green represents positive states and primary actions.
- Amber represents caution and attention.
- Red represents errors and destructive actions.
- Blue represents informational states.
- Never rely on color alone to communicate status.

For example, a warning should include an icon and explanatory text, not merely an amber border.

#### 2.4 Data visualization palette

Treemap and chart categories should use a restrained, distinguishable palette.

| Category | Color |
| --- | --- |
| Documents | #A7BCA0 |
| Images | #83A89A |
| Videos | #8DA4BE |
| Audio | #B4A1C5 |
| Archives | #C5AB78 |
| Applications | #9DAD8B |
| System | #8C9891 |
| Other | #C2C8BF |

Data colors must be distinguishable in both themes. Add labels or legends.

---

### 3. Typography

Font families

- Interface: Inter
- Technical information: IBM Plex Mono

Use local font files packaged with the application where possible.

Type scale

| Token | Size | Weight | Usage |
| --- | --- | --- | --- |
| display | 32px | 600 | Exceptional overview metrics |
| h1 | 24px | 600 | Page titles |
| h2 | 18px | 600 | Section titles |
| h3 | 15px | 600 | Card titles |
| body | 13px | 400 | Main interface text |
| body-medium | 13px | 500 | Emphasized text |
| small | 12px | 400 | Secondary information |
| caption | 11px | 400 | Metadata |
| metric | 28px | 600 | Important numbers |

Typography rules

- Use sentence case.
- Avoid excessive bold text.
- Do not use uppercase for ordinary section headings.
- Use tabular numbers for storage metrics.
- Use monospace for file paths, hashes, and technical identifiers.

---

### 4. Spacing system

Use a 4px base unit.

| Token | Value |
| --- | --- |
| space-1 | 4px |
| space-2 | 8px |
| space-3 | 12px |
| space-4 | 16px |
| space-5 | 20px |
| space-6 | 24px |
| space-8 | 32px |
| space-10 | 40px |
| space-12 | 48px |
| space-16 | 64px |

Layout rules

- Page content padding: 28px.
- Card padding: 16–20px.
- Section separation: 28–32px.
- Compact table row: 36px.
- Comfortable table row: 44px.
- Form field spacing: 16px.
- Button height: 36px.
- Input height: 36px.

Avoid excessive vertical spacing in information-dense views.

---

### 5. Border radius and elevation

Radius

| Token | Value |
| --- | --- |
| radius-xs | 4px |
| radius-sm | 6px |
| radius-md | 8px |
| radius-lg | 12px |
| radius-xl | 16px |
| radius-full | 9999px |

Shadows

Use borders as the primary method of separating surfaces.

Shadows should be limited to:

- Dropdowns.
- Popovers.
- Dialogs.
- Floating panels.
- Drag previews.

Avoid large shadows around ordinary cards.

---

### 6. Motion and transitions

Use motion to communicate state changes.

| Interaction | Duration |
| --- | --- |
| Hover | 120ms |
| Button press | 100ms |
| Dropdown | 140ms |
| Dialog | 180ms |
| Sidebar transition | 180ms |
| Panel transition | 200ms |

Recommended easing: ease-out for entrances and ease-in-out for layout transitions.

Respect "prefers-reduced-motion".

Avoid continuous decorative animations.

---

## PART III — APPLICATION LAYOUT

### 7. Desktop window

ZenDisk is designed primarily for a desktop environment.

Recommended dimensions

- Ideal: 1440 × 900.
- Comfortable minimum: 1100 × 720.
- Absolute minimum: 900 × 600.

At smaller sizes, adapt content density and navigation instead of simply shrinking everything.

Main application structure

```
┌──────────────────────────────────────────────────────┐
│ Window Title Bar                                     │
├───────────────┬──────────────────────────────────────┤
│               │ Page Header                          │
│               ├──────────────────────────────────────┤
│               │                                      │
│   Sidebar     │                                      │
│               │                                      │
│   Navigation  │         Main Content                 │
│               │                                      │
│               │                                      │
│               │                                      │
│               ├──────────────────────────────────────┤
│               │ Optional Status Bar                  │
└───────────────┴──────────────────────────────────────┘
```

#### 7.1 Sidebar

Recommended width: 220px.

Collapsed width: 64px.

Sidebar contents:

**Brand**

- ZenDisk icon.
- ZenDisk name.
- Optional collapse control.

**Primary navigation**

1. Overview
2. Disk Analysis
3. Cleanup
4. Organization
5. Duplicates
6. Maintenance
7. Automation
8. Reports

**Bottom navigation**

- Settings.
- License and plan.
- Help.

Sidebar behavior

- Active item has a subtle matcha background.
- Icons use consistent 16–18px sizing.
- Collapsed navigation displays tooltips.
- Navigation must preserve the current page state where appropriate.
- Sidebar width can be persisted between sessions.

Avoid giving every navigation item its own strong background or color.

#### 7.2 Page header

Height: approximately 60px.

Contains:

- Page title.
- Optional breadcrumb.
- Contextual selector.
- Optional actions.
- Notifications.

Do not duplicate page titles inside the content area.

#### 7.3 Main content

- Scroll independently from the sidebar.
- Use a consistent page container.
- Keep important controls visible.
- Support tables and visualization panels without forcing horizontal scrolling unnecessarily.

#### 7.4 Status bar

Optional bottom area.

Display:

- Current background operations.
- Active scan count.
- Selected drive.
- Application version.

Do not make the status bar visually dominant.

---

## PART IV — COMPONENT LIBRARY

### 8. Component architecture

Organize components by responsibility.

```
src/
├── app/
│   ├── App.tsx
│   ├── router.tsx
│   └── providers/
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── data-display/
│   ├── forms/
│   ├── feedback/
│   ├── file-system/
│   ├── disk/
│   ├── cleanup/
│   ├── organizer/
│   ├── duplicates/
│   ├── maintenance/
│   └── automation/
│
├── features/
│   ├── overview/
│   ├── disk-analysis/
│   ├── cleanup/
│   ├── organization/
│   ├── duplicates/
│   ├── maintenance/
│   ├── automation/
│   ├── reports/
│   └── settings/
│
├── hooks/
├── lib/
│   ├── formatters/
│   ├── validators/
│   └── utils/
│
├── stores/
├── styles/
│   ├── globals.css
│   ├── tokens.css
│   ├── themes.css
│   └── typography.css
│
└── types/
```

Use feature-specific components for complex modules. Avoid creating one enormous shared component directory.

---

### 9. Foundation components

**Button**

Variants:

- primary
- secondary
- outline
- ghost
- destructive
- link

Sizes:

- xs
- sm
- md
- lg
- icon

States:

- default
- hover
- active
- focus
- disabled
- loading

Rules:

- Buttons must communicate their purpose.
- Destructive actions use explicit labels.
- Icon-only buttons require accessible labels and tooltips.

**IconButton**

For compact contextual actions.

Examples:

- More options.
- Refresh.
- Close.
- Expand.
- Filter.

**Input**

Support:

- Text.
- Search.
- Numeric.
- Path input.
- Clearable input.
- Validation.

**Select**

Support:

- Single selection.
- Multi-selection where required.
- Searchable options.
- Empty state.
- Disabled options.

**Checkbox**

Use for multi-selection and optional settings.

**Switch**

Use for persistent binary settings and automation activation.

**RadioGroup**

Use for mutually exclusive choices.

**Slider**

Use for numerical ranges, such as minimum file size.

**Tabs**

Use when multiple views belong to the same workflow.

Avoid excessive nested tabs.

**Tooltip**

Use for icon-only controls and technical abbreviations.

**DropdownMenu**

Support:

- Sections.
- Dividers.
- Icons.
- Keyboard navigation.
- Destructive actions.

**ContextMenu**

Used for file rows, folders, drives, and treemap items.

**Separator**

A subtle structural divider.

---

### 10. Layout components

**AppShell**

The root application layout.

Responsibilities:

- Sidebar.
- Header.
- Main content.
- Global notifications.
- Dialog portal.
- Background task indicator.

**Sidebar**

Properties:

- collapsed
- activeRoute
- onNavigate

**PageHeader**

Properties:

- title
- description
- breadcrumbs
- actions

**PageContainer**

Consistent content padding and maximum width.

**Section**

Contains:

- Heading.
- Optional description.
- Optional actions.
- Content.

**Stack**

Vertical layout with tokenized spacing.

**Inline**

Horizontal layout with alignment and gap.

**SplitPanel**

Resizable two-panel layouts.

Examples:

- File explorer and details.
- Rule list and rule editor.

**Card**

Variants:

- default
- muted
- outlined
- interactive

Cards should be used to group related information, not to wrap every individual element.

---

### 11. Data-display components

**MetricCard**

Properties:

- label
- value
- unit
- trend
- description
- icon

Example: "Total storage — 1.2 TB"

**ProgressBar**

Use for storage usage and task progress.

Support:

- Value.
- Maximum.
- Semantic state.
- Optional label.

**StorageBar**

Segmented horizontal representation of storage categories.

**DriveCard**

Display:

- Drive name.
- Letter.
- Drive type.
- Filesystem.
- Capacity.
- Free space.
- Usage percentage.

**FileSize**

Format bytes consistently using binary units by default.

Examples:

- 512 KB.
- 2.4 GB.
- 1.2 TB.

Use consistent precision.

**DateDisplay**

Display human-friendly dates with a tooltip containing the exact timestamp.

**StatusBadge**

Statuses:

- Healthy.
- Warning.
- Critical.
- Running.
- Completed.
- Failed.
- Paused.

**DataTable**

Required capabilities:

- Sorting.
- Filtering.
- Selection.
- Multi-selection.
- Column visibility.
- Column resizing where useful.
- Pagination or virtualization.
- Empty state.
- Loading state.
- Context menu.

**SearchInput**

Searches the currently relevant data scope.

**FilterBar**

Composable filter controls.

**EmptyState**

Contains:

- Icon or illustration.
- Heading.
- Description.
- Optional action.

Avoid unnecessary decorative illustrations.

**Skeleton**

Loading placeholders matching actual component dimensions.

---

### 12. File-system components

**FileIcon**

Maps file categories and extensions to icons.

**FileRow**

Display:

- Selection checkbox.
- File icon.
- Filename.
- Location.
- Size.
- Modified date.
- Optional status.

**FolderRow**

Similar to FileRow but supports folder expansion.

**FileList**

Supports:

- Sorting.
- Filtering.
- Multi-selection.
- Context menus.
- Batch actions.

**BreadcrumbPath**

Displays the current filesystem path.

Long paths should truncate intelligently and allow copying the full path.

**FileDetailsPanel**

Display:

- Full path.
- Name.
- Extension.
- Size.
- Created date.
- Modified date.
- File attributes.
- Hash when available.

**FilePreview**

Optional preview for supported formats.

Never attempt to render arbitrary files as trusted HTML.

**Treemap**

A dedicated storage visualization component.

Requirements:

- Hierarchical rectangles.
- Labels when space permits.
- Hover details.
- Selection.
- Zoom and navigation.
- Breadcrumb support.
- Legend.
- Accessible alternative list.

Treemap colors must not be the only way to distinguish categories.

---

### 13. Feedback components

**Toast**

Variants:

- success
- info
- warning
- error

Examples:

- Scan completed.
- Organization applied.
- Files moved.
- Operation failed.

**Dialog**

Use for decisions requiring focused attention.

**AlertDialog**

Use for potentially destructive actions.

**Sheet / Drawer**

Use for:

- File details.
- Advanced settings.
- Filters.
- Contextual configuration.

**ProgressDialog**

Used for long-running tasks when a dedicated progress view is appropriate.

**OperationSummary**

Displays:

- Completed operations.
- Failed operations.
- Skipped files.
- Total affected files.
- Reclaimed space.

**InlineAlert**

For contextual warnings and important information.

---

## PART V — SCREEN SPECIFICATIONS

### 14. Overview screen

Route: `/overview`

Purpose

Provide an immediate understanding of the computer's storage state.

Layout

```
┌─────────────────────────────────────────────┐
│ Overview                                    │
│ Your storage at a glance.                  │
├─────────────────────────────────────────────┤
│                                             │
│ Total Storage       Available              │
│ 1.2 TB              632 GB                  │
│                                             │
├─────────────────────┬───────────────────────┤
│ Drive C:            │ Drive D:              │
│ Usage bar           │ Usage bar             │
├─────────────────────┴───────────────────────┤
│ Quick Actions                               │
│ [Analyze] [Clean] [Organize] [Duplicates]   │
├─────────────────────────────────────────────┤
│ Recent Activity                             │
├─────────────────────────────────────────────┤
│ Recommendations                            │
└─────────────────────────────────────────────┘
```

Components

- StorageSummary.
- DriveCard.
- QuickAction.
- RecentActivity.
- RecommendationList.
- StorageBar.

Behavior

- Clicking a drive opens Disk Analysis with that drive selected.
- Quick actions navigate to their corresponding workflows.
- Recommendations must be evidence-based and dismissible.

---

### 15. Disk Analysis screen

Route: `/disk-analysis`

Purpose

Understand the contents of a selected drive.

Layout

```
┌─────────────────────────────────────────────┐
│ Disk Analysis                 [Scan]        │
│ [Drive selector] [Filters]                  │
├─────────────────────────────────────────────┤
│ Capacity summary                            │
├─────────────────────────────────────────────┤
│                                             │
│             Interactive Treemap             │
│                                             │
├──────────────────────┬──────────────────────┤
│ File Type Breakdown  │ Largest Files       │
│                      │                      │
├──────────────────────┴──────────────────────┤
│ Largest Folders                             │
└─────────────────────────────────────────────┘
```

Interactions

- Selecting a rectangle opens its details.
- Double-clicking a folder navigates deeper.
- Breadcrumbs navigate to ancestors.
- Search filters current results.
- Filters apply to the active drive.
- Scan can be paused or cancelled when supported.

Scan states

- Idle.
- Discovering.
- Scanning.
- Paused.
- Completed.
- Cancelled.
- Failed.

Display partial results when technically safe and clearly label them as incomplete.

---

### 16. Cleanup screen

Route: `/cleanup`

Purpose

Identify files suitable for cleanup and reclaim space.

Tabs

- Quick Scan.
- Custom Cleanup.
- Advanced.

Layout

```
┌─────────────────────────────────────────────┐
│ Cleanup                       [Scan]        │
├─────────────────────────────────────────────┤
│ Quick Scan | Custom | Advanced              │
├─────────────────────────────────────────────┤
│                                             │
│       Scan Results                          │
│                                             │
│ [ ] Temporary Files             2.1 GB      │
│ [ ] Application Cache            1.5 GB      │
│ [ ] Old Installers               1.2 GB      │
│ [ ] Logs                         0.4 GB      │
│                                             │
├─────────────────────────────────────────────┤
│ Selected: 3.8 GB             [Review]       │
└─────────────────────────────────────────────┘
```

Review workflow

1. Select categories.
2. Review exact files.
3. Inspect warnings.
4. Confirm action.
5. Execute.
6. Display summary.

The UI must never imply that all identified files are safe to delete.

---

### 17. Organization screen

Route: `/organization`

Purpose

Manage reusable rules for organizing files.

Layout

```
┌─────────────────────────────────────────────┐
│ Organization                  [+ New Rule]  │
├─────────────────────────────────────────────┤
│ Rules | Templates | Preview | History       │
├──────────────────────┬──────────────────────┤
│ Rule List            │ Rule Editor          │
│                      │                      │
│ Downloads            │ Source: Downloads    │
│ Photos by Date       │                      │
│ Videos by Date       │ Conditions           │
│ Documents            │                      │
│ Custom               │ Actions              │
│                      │                      │
│                      │ [Preview] [Save]     │
└──────────────────────┴──────────────────────┘
```

Rule builder

A rule consists of:

- Name.
- Source.
- Conditions.
- Actions.
- Destination.
- Exclusions.
- Schedule.

Rule preview

Display a table of proposed changes.

Columns:

- Original location.
- Proposed location.
- Action.
- Conflict status.

Allow applying all changes or selecting individual operations.

---

### 18. Duplicate Finder screen

Route: `/duplicates`

Tabs

- Exact.
- Similar Names.
- Similar Images.
- Similar Media.

Layout

```
┌─────────────────────────────────────────────┐
│ Duplicate Finder               [Scan]       │
├─────────────────────────────────────────────┤
│ Exact | Similar | Images | Media            │
├─────────────────────────────────────────────┤
│ Filters                                     │
├─────────────────────────────────────────────┤
│ Duplicate Group                             │
│                                             │
│ [ ] image.jpg     2.4 MB    C:/Photos       │
│ [ ] image.jpg     2.4 MB    D:/Backup       │
│ [ ] image.jpg     2.4 MB    E:/Photos       │
│                                             │
├─────────────────────────────────────────────┤
│ Selected: 2 files           [Review]        │
└─────────────────────────────────────────────┘
```

Behavior

- Group exact matches by verified content.
- Compare paths and dates.
- Show hash details when requested.
- Allow manual selection.
- Support safe quarantine.

Do not automatically delete files simply because their hashes match. The user decides which copies to retain.

---

### 19. Maintenance screen

Route: `/maintenance`

Tabs

- Overview.
- Startup.
- Applications.
- Disk Health.

Overview

Display:

- CPU.
- Memory.
- Disk activity.
- Temperature where supported.
- Recent maintenance events.

Startup

Display:

- Application.
- Publisher.
- Startup status.
- Available actions.

Applications

Display:

- Installed application.
- Publisher.
- Version.
- Installation date.
- Estimated disk usage.

Disk Health

Display available drive health information with source and limitations.

Avoid presenting unsupported metrics as actual measurements.

---

### 20. Automation screen

Route: `/automation`

Tabs

- Scheduled Tasks.
- History.

Task cards

Display:

- Task name.
- Operation type.
- Schedule.
- Target.
- Last execution.
- Enabled status.

Task editor

Allow configuration of:

- Task name.
- Action.
- Target drives and directories.
- Conditions.
- Frequency.
- Execution behavior.
- Notifications.

History

Display:

- Start time.
- Duration.
- Result.
- Files processed.
- Errors.

Users should always be able to disable scheduled actions.

---

### 21. Reports screen

Route: `/reports`

Purpose

Understand storage changes over time.

Layout

```
┌─────────────────────────────────────────────┐
│ Reports                    [Last 30 days]   │
├─────────────────────────────────────────────┤
│ Recovered     Duplicates     Files Organized│
├─────────────────────────────────────────────┤
│                                             │
│           Storage Growth Chart              │
│                                             │
├─────────────────────────────────────────────┤
│ Activity Timeline                           │
├─────────────────────────────────────────────┤
│ Recommendations                             │
└─────────────────────────────────────────────┘
```

Use meaningful charts with readable labels, legends, and tooltips.

---

### 22. Settings screen

Route: `/settings`

Use a settings navigation panel with the following sections:

1. General.
2. Appearance.
3. Notifications.
4. Cleanup.
5. Organization.
6. Storage.
7. Privacy.
8. License.

Prefer simple forms grouped by purpose.

Settings should explain consequences where necessary.

---

## PART VI — SHARED INTERACTION PATTERNS

### 23. File selection

Support:

- Single selection.
- Multi-selection.
- Select all.
- Range selection.
- Invert selection.
- Keyboard navigation.

When files are selected, show a contextual bulk-action toolbar.

### 24. Context menus

**File context menu**

- Open.
- Open containing folder.
- Copy path.
- Inspect details.
- Move.
- Rename.
- Quarantine.
- Delete.

Hide or disable actions that are unsupported for a particular file.

**Folder context menu**

- Open.
- Analyze.
- Organize.
- Copy path.
- Exclude from scans.
- Inspect details.

### 25. Confirmation patterns

Use confirmation dialogs for destructive operations.

A confirmation must explain:

- What will happen.
- How many items are affected.
- Where the files are located.
- Whether recovery is possible.

Avoid generic "Are you sure?" dialogs.

### 26. Loading and progress

For long-running work:

- Display progress.
- Show the current operation.
- Display elapsed time where useful.
- Allow cancellation when supported.
- Keep the interface responsive.
- Clearly distinguish indeterminate from measurable progress.

### 27. Empty, error and permission states

Every screen must support:

- Initial empty state.
- Loading state.
- Completed state.
- Partial results.
- Error state.
- Permission denied.
- Drive unavailable.
- No matching results.

Errors must explain the next possible action.

---

## PART VII — REACT IMPLEMENTATION

### 28. Recommended stack

| Concern | Technology |
| --- | --- |
| UI | React |
| Language | TypeScript |
| Build | Vite |
| Desktop | Electron *(superseded by Neutralinojs in this repository)* |
| Styling | Tailwind CSS |
| UI foundation | shadcn/ui |
| Icons | Lucide React |
| Routing | React Router |
| Server state | TanStack Query |
| UI state | Zustand |
| Tables | TanStack Table |
| Validation | Zod |
| Forms | React Hook Form |
| Charts | Recharts |
| Virtualization | TanStack Virtual |
| Animation | CSS transitions |

Treat shadcn/ui as a foundation, not as the finished visual design. Customize components to the ZenDisk system.

### 29. Component conventions

- Functional React components.
- Explicit TypeScript interfaces.
- Named exports.
- Feature-oriented organization.
- Shared design tokens.
- No direct filesystem operations from components.
- No direct native API access from arbitrary UI components *(the spec says "Electron API"; in this repository it means `@neutralinojs/lib` — see §32 delta)*.

Example:

```tsx
export interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
}

export function MetricCard({
  label,
  value,
  description,
  trend,
}: MetricCardProps) {
  return (
    <section className="metric-card">
      <span className="metric-card__label">
        {label}
      </span>

      <strong className="metric-card__value">
        {value}
      </strong>

      {description && (
        <span className="metric-card__description">
          {description}
        </span>
      )}

      {trend && (
        <span data-direction={trend.direction}>
          {trend.value}
        </span>
      )}
    </section>
  );
}
```

This example illustrates component structure. Production components should use the shared design tokens and established typography primitives.

### 30. Design tokens implementation

Keep tokens centralized and theme-aware.

Suggested structure:

```
styles/
├── tokens.css
├── themes.css
├── typography.css
├── globals.css
└── components.css
```

Use CSS variables as the source of truth.

Example:

```css
:root {
  --background: #f7f8f4;
  --foreground: #263b34;

  --surface: #ffffff;
  --surface-secondary: #eef1ea;

  --primary: #276653;
  --primary-foreground: #ffffff;

  --muted: #77847d;
  --border: #e3e8df;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}

.dark {
  --background: #171d19;
  --foreground: #e8eee8;

  --surface: #202923;
  --surface-secondary: #28342c;

  --primary: #8fbca4;
  --primary-foreground: #19271f;

  --muted: #a1ada3;
  --border: #354139;
}
```

Additional tokens should be added for all semantic colors, focus states, elevation, typography, and chart categories.

### 31. React state boundaries

Separate state into three categories.

**Local component state**

Use React state for:

- Dialog visibility.
- Open dropdowns.
- Temporary form inputs.
- Local filters.

**Shared UI state**

Use Zustand for:

- Sidebar state.
- Theme.
- Selected drive.
- Application preferences.
- Global dialogs.
- Active background operation indicators.

**Server/application state**

Use TanStack Query for:

- Disk information.
- Scan results.
- File listings.
- Cleanup categories.
- Automation records.
- Operation history.

Use invalidation and updates after operations rather than maintaining duplicated copies of the same data.

### 32. Electron boundary *(superseded in this repository)*

> **Implementation delta:** ZenDisk now uses Neutralinojs. There is no Electron main process or preload bridge. The equivalent boundary is the typed facade in `apps/desktop/src/renderer/lib/native/`, with native permissions allowlisted in `apps/desktop/neutralino.config.json`. The principle below still applies in full: the renderer must not access privileged APIs directly, every operation must validate inputs and outputs, and only allowlisted operations may be exposed.

React must not access Node.js filesystem APIs directly.

Recommended architecture:

```
React Renderer
      |
      | Typed IPC
      |
Preload Bridge
      |
      | Context Bridge
      |
Electron Main
      |
Core Services
      |
Filesystem / Operating System
```

Expose a small, typed API from the preload script.

Examples of logical frontend operations:

- disk.list()
- disk.analyze()
- files.list()
- files.inspect()
- cleanup.preview()
- cleanup.execute()
- organizer.preview()
- organizer.execute()
- duplicates.scan()
- operations.history()

These are proposed API names, not existing Electron APIs.

Every IPC operation must validate inputs and outputs.

Use allowlisted operations rather than exposing unrestricted filesystem access to the renderer.

---

## PART VIII — RESPONSIVE AND ACCESSIBILITY REQUIREMENTS

### 33. Window-size adaptation

**Large window: 1440px and above**

- Full sidebar.
- Two-column dashboard.
- Rich data tables.
- Split-panel editing.

**Medium window: 1100–1439px**

- Full or collapsible sidebar.
- More compact cards.
- Adaptive grids.
- Reduced secondary spacing.

**Small desktop window: 900–1099px**

- Collapsed sidebar.
- Single-column sections where necessary.
- Drawers instead of permanent secondary panels.
- Horizontal scrolling only for genuinely wide data tables.

Do not design ZenDisk as a mobile-first interface. It is a desktop workspace.

### 34. Accessibility

Requirements:

- Keyboard-accessible navigation.
- Visible focus indicators.
- Semantic HTML.
- Accessible dialogs.
- Screen-reader labels.
- Sufficient text contrast.
- Reduced-motion support.
- Tooltips for icon-only buttons.
- Non-color status indicators.

Important shortcuts:

| Shortcut | Action |
| --- | --- |
| Ctrl + K | Global search |
| Ctrl + 1 | Overview |
| Ctrl + 2 | Disk Analysis |
| Ctrl + F | Search current view |
| Ctrl + , | Settings |
| Ctrl + R | Refresh current view |
| Escape | Close active dialog or menu |
| Delete | Contextual delete, with confirmation |

Shortcuts must not override standard text-editing behavior when an input has focus.

---

## PART IX — QUALITY AND ACCEPTANCE CRITERIA

### 35. Design quality checklist

**Visual consistency**

- [ ] All components use design tokens.
- [ ] Both themes are supported.
- [ ] Typography follows the type scale.
- [ ] Spacing is consistent.
- [ ] Borders and shadows are restrained.
- [ ] Icons use consistent sizing.

**Usability**

- [ ] Every screen has a clear purpose.
- [ ] Important actions are discoverable.
- [ ] Advanced controls remain accessible.
- [ ] Tables support realistic data volumes.
- [ ] Long filenames and paths are handled correctly.
- [ ] Empty and error states are designed.

**Reliability**

- [ ] Long operations do not freeze React.
- [ ] Progress is communicated.
- [ ] Destructive actions require appropriate confirmation.
- [ ] Operation history is accessible.
- [ ] Permissions are respected.
- [ ] Interrupted operations are handled safely.

**Accessibility**

- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Dialogs are accessible.
- [ ] Colors are not the only status indicator.
- [ ] Reduced-motion preferences are respected.

---

## PART X — IMPLEMENTATION PRIORITY

### 36. Build order

**Phase 1: Foundation**

- Design tokens.
- Theme provider.
- Typography.
- Button.
- Input.
- Select.
- Dialog.
- Tooltip.
- Sidebar.
- AppShell.
- PageHeader.

**Phase 2: Shared data components**

- MetricCard.
- DriveCard.
- FileRow.
- FileList.
- DataTable.
- ProgressBar.
- StorageBar.
- EmptyState.
- Toast.

**Phase 3: Main screens**

- Overview.
- Disk Analysis.
- Cleanup.
- Organization.
- Duplicates.

**Phase 4: Advanced screens**

- Maintenance.
- Automation.
- Reports.
- Settings.

**Phase 5: Polish**

- Dark theme.
- Keyboard shortcuts.
- Accessibility.
- Loading states.
- Error states.
- Responsive window behavior.
- Micro-interactions.

### 37. Final design contract

Every developer and coding agent working on ZenDisk must follow these rules:

1. Never introduce a new color without a design token.
2. Never create a visually inconsistent component when an existing shared component can be extended.
3. Never hide useful advanced functionality in the name of minimalism.
4. Never use decorative elements that compete with important information.
5. Never execute destructive file operations without appropriate user awareness.
6. Never block the renderer with expensive operations.
7. Always design loading, empty, error, and success states.
8. Keep the light and dark themes equally polished.
9. Keep layouts information-rich but breathable.
10. Prefer predictable interactions over surprising animations or automatic behavior.

ZenDisk should feel calm because it is well organized, not because it has fewer capabilities.
