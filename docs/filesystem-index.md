# Filesystem discovery & analysis: audit, design, and decision rules

Status: **Phase 6 addition — incremental filesystem index** (see `ROADMAP.md`).
This document is the source of truth for how ZenDisk decides what to process. It
records the audit of the original scanner, the root causes of repeated work, the
architecture that replaces it, and the observable rules of the decision engine.

Terminology matters. The following are **different operations** and the index
treats them separately:

| Operation | Cost | When it is allowed |
| --- | --- | --- |
| Rediscover a path (`read_dir`) | directory I/O | Only for directories not checkpointed in the current generation, or explicitly stale. |
| Re-read metadata (`stat`) | one cheap syscall | Verification level 2; bounded by a recheck interval. |
| Re-read file contents | sequential/seek I/O | Only at verification level 3, and only head/tail by default. |
| Re-analyse contents | CPU | Only when metadata changed, analysis version is stale, or a previous analysis failed. |
| Recompute classification | pure CPU | Only when the content analysis result changes. |
| Update a database record | one indexed upsert | Cheap; batched. This is **not** re-analysis. |

---

## 1. Audit of the existing implementation (before this change)

The complete lifecycle was traced as
`Scan request → Directory traversal → File discovery → Metadata extraction → Analysis → Persistence → UI update`.

### 1.1 Tauri commands and Rust traversal

- `disk_analyze` (`commands.rs`) registers a job id and cancellation/pause flags,
  then calls `walk_tree` in `spawn_blocking`.
- `walk_tree` is a recursive, single-threaded `fs::read_dir` walk from the drive
  root. For each entry it calls `DirEntry::metadata()` (one stat, already an
  optimisation over an earlier two-stat version), increments `items`, and calls
  `file_entry_from_metadata` for every file.
- `duplicates_scan` runs a **second, independent** recursive walk from the root
  and then hashes size-collision groups (head/tail partial digest, then full
  BLAKE3). It shares no state with `disk_analyze`.

### 1.2 React orchestration

- `useAnalysis(driveId)` mints a new job id from `Date.now()`, Math.random() and a
  `revision` counter on every mount, drive change, and *rescan*. Its query key
  includes that job id, so TanStack Query can never replay a cached analysis:
  **every "Rescan" click starts a full native walk**.
- `useScanProgress(jobId)` listens to `zendisk://scan-progress`; the Rust side
  emits at most every ~200 ms (one aggregated event, not one per file — correct).
- `useDuplicates` likewise starts a fresh full walk on every query (staleTime
  30 s only suppresses duplicate queries during that window).
- No hook persists scan results, checkpoints, or file identity in React state.
  React only holds the final aggregated payload.

### 1.3 Persistence

The only SQLite table was `operations` (operation history, capped at 200 rows),
plus the Tauri `store` plugin for preferences. `history.sqlite` had **no WAL or
busy_timeout**, despite concurrent headless/UI writes being an explicit roadmap
risk. There was no filesystem index of any kind.

### 1.4 Caching, metadata, and analysis

- `FileEntry.id` came from `new_id()` (nanoseconds + pid) on every walk, so the
  same file got a **different stable id on every scan**. Nothing could be
  matched across scans.
- No canonical path, extension, file type, creation time, filesystem identity,
  discovery timestamp, verification timestamp, analysis timestamp, fingerprint,
  analysis status, analysis version, or classification was stored anywhere.
- "Analysis" in the scan path is only `file_entry_from_metadata` (name, path,
  size, modified time). It was repeated for every file on every scan.
- Content hashing existed **only** in the duplicate pipeline, and those hashes
  were discarded at the end of the call. A second duplicate scan re-read and
  re-hashed everything.

### 1.5 Limits, cancellation, progress

- Hardcoded `SCAN_ITEM_LIMIT = 200_000`, `SCAN_TIME_LIMIT = 25 s`, directory
  depth `< 3`, top-20 file caps, and a 25-sample skip cap.
- Hitting the budget stopped discovery **and discarded progress**; the next scan
  started again at the root, so a large drive could never be fully indexed.
- Cancellation (`AtomicBool`) and pause (`AtomicBool` that extends the deadline)
  existed for `disk_analyze` only; `duplicates_scan` had cancellation but no
  pause and a single progress event.
- Skips were classified and counted (`unreadable`, `excluded`, `reparse`,
  `budget`) — this part was good and is preserved.

### 1.6 Root causes of repeated work

1. **No persistent identity.** A rescan cannot answer "have I seen this path
   before?" because ids are time-based and no record survives the call.
2. **No generation/checkpoint model.** Every scan is generation 0 from the root.
   There is no directory-level state to resume from.
3. **Analysis is entangled with traversal.** Building `FileEntry` objects for
   every file happens inside the walk, so a UI refresh forces metadata work for
   the whole tree even when only aggregate views are needed.
4. **No change detection levels.** Size/mtime/identity are read but never
   *compared to a previous value*, so "unchanged" is unrepresentable.
5. **No invalidation source.** No watcher, no change events, no reconciliation
   of deleted/moved/renamed entries. The app's only strategy is "walk again".
6. **No persistent work queue.** Work that was interrupted, failed, or pending
   simply does not exist between runs.
7. **Hash results are thrown away.** The expensive part (BLAKE3) is recomputed
   from scratch.

Distinction: the old scanner **rediscovered every path, reread metadata for
every file, never read contents outside duplicates, "analysed" (built a
`FileEntry` for) every file, and updated no persistent record at all.**

---

## 2. Proposed architecture

Filesystem operations stay in Rust. The new `fs_index` module owns four
independently resumable operations and one SQLite store:

```
                        ┌─────────────────────────────┐
 change hints ─────────▶│ watch / apply_changes       │
 (watcher, UI, scheduler)│  mark stale → enqueue work  │
                        └──────────────┬──────────────┘
                                       │
  index_discover ──▶ [A] Discovery ──▶ [B] Metadata index ──┐
  (resumable)         directories      files (cheap fields) │
                       checkpoints                          ▼
  index_process ──────────────────────────────▶ [C] Content analysis
  (persistent work queue)                        (partial fingerprint first)
                                                              │
  index_reconcile ─▶ [D] Reconciliation (deleted/moved/overflow) │
                                                              ▼
                                              index snapshot → disk_analyze → UI
```

- **One store, one database.** `fs_index.sqlite` in the app data directory,
  separate from `history.sqlite`. WAL + `busy_timeout` + `synchronous=NORMAL`
  are set on **every** connection, including the history database.
- **Path-keyed records.** The canonical path is the primary key. File identity
  (inode/dev on Unix, volume serial + file index on Windows) is stored for move
  detection, never as a substitute for the path.
- **Generations.** Each discovery run advances a per-root generation. A row with
  `generation == current` was observed in the current pass; older rows are
  reconciliation candidates, not instant deletions.
- **No global cursor.** `directories` rows carry `pending/scanned/stale/...`
  state and depth. A changed or interrupted directory is re-queued individually
  without losing the rest of the traversal.
- **Batched writes.** File rows are staged in memory and flushed in
  transactions (default 500 rows). Directory checkpoints are committed per
  directory, so a crash costs at most one directory of work.

### 2.1 Index record

Each `files` row stores: canonical path, parent, name, extension, content kind,
size, modified/created timestamps (Unix ns), filesystem identity, discovered /
metadata-verified / content-analysed timestamps, optional content fingerprint,
analysis status, analysis version, classification JSON, generation, and
presence state. Analysis version constants make stale results explicit: when
the classifier changes, bump `ANALYSIS_VERSION` and only those files are
re-analysed.

### 2.2 Verification levels

1. **Cached knowledge** — known path + current analysis version + status
   `analyzed` + no stale marker + recent verification ⇒ `skipUnchanged`. Zero
   filesystem I/O.
2. **Cheap metadata** — compare size, modified ns, and identity. Equal ⇒ update
   `metadata_verified_at` only. Different ⇒ enqueue content analysis. Applied
   on a configurable interval (default 1 h) or when a change hint arrives.
3. **Content** — only for work items. A partial head/tail fingerprint detects
   "same content, new timestamps"; it avoids a full read and avoids
   reclassification. Full hashing is reserved for the duplicate pipeline and
   is itself cached. It is used only when metadata is insufficient (unreliable
   timestamps or an explicit user request).

### 2.3 Scan decision engine

`decide_entry` is a pure function returning one of `ignore`, `skipUnchanged`,
`verifyMetadata`, `analyze`, `defer`, `retry` plus a machine-readable reason and
rule name. Every decision is counted; ignored paths are never silently dropped.

- **Ignored:** reparse points/junctions, protected OS locations, configured
  excluded names/segments/extensions, known temporary/lock files.
- **Deferred (not ignored):** very large files, archives, disk images, databases,
  media, unknown binaries. They are classified by name/size, assigned low queue
  priority, and processed within the run budget. They are never automatically
  excluded from analysis just because they are large.
- **Retry:** previous failure with attempts below the limit; exponential backoff
  with jitter, then a terminal `failed` state (no infinite retry loop).
- Exclusions are configurable through `index_config` and persisted. The built-in
  defaults mirror today's protected names and are visible in UI/skip counts.

### 2.4 Persistent work queue

`work_queue` has `UNIQUE(root, path, kind)`, so a file cannot accumulate
duplicate jobs. Priorities: user-requested paths (100) > newly discovered (80) >
recently modified (70) > stale analysis version (60) > interrupted work (50) >
watcher hints (40) > background reconciliation (10). Items are claimed in a
bounded batch, marked `running`, and reset to `pending` on startup (crash
recovery). Failures back off; terminal failures stay visible for explanation.

### 2.5 Watcher and reconciliation

Change notifications are **hints**: `index_apply_changes` ingests
`created/modified/renamed/deleted/overflow` events (from a future `notify`
watcher, the UI, or the scheduler), marks the affected row stale, re-queues a
directory, and enqueues a high-priority metadata verification. An `overflow`
event flips a `needs_full_reconciliation` flag; discovery then re-walks every
directory in that root. Because watchers can be dropped, capped, or
unsupported, `index_reconcile` is also run periodically and on startup: it
compares generations, resolves moves by identity, marks missing entries, and
never deletes records silently (a separate prune operation is required).

> Implementation note: the `notify` crate is not in the offline dependency cache
> and a new native dependency must be validated on the Windows CI host. The
> ingestion seam, overflow handling, and reconciliation fallback are implemented
> now; binding a platform watcher to `index_apply_changes` is the remaining step
> and requires no index redesign.

### 2.6 What the UI sees

`disk_analyze` is now index-first: if the root is current (complete generation,
no pending work, no change hints, and a stored snapshot), it returns that
snapshot with **no filesystem walk**. Otherwise it runs one bounded, resumable
discovery pass and rebuilds the snapshot from indexed rows via SQL aggregates.
The UI receives aggregated events (`zendisk://index-progress`) with counters for
discovered, newly indexed, unchanged, metadata-verified, analysis-scheduled,
analysed, ignored, deferred, failed, and pending work — never per-file IPC.
Progress is counts of actual work, not a fabricated percentage of an unknown
total. The existing `budgetExceeded`, skip counts, and partial-results UI are
preserved; a budget now means "more work is queued for the next pass", not "work
is lost".

---

## 3. Commands added to the facade

| Command | Purpose |
| --- | --- |
| `index_status(root)` | generation, freshness, pending work, counters |
| `index_discover(root, jobId, force?)` | resumable discovery + metadata indexing pass |
| `index_process(root, jobId, limit?)` | process a bounded slice of the work queue |
| `index_reconcile(root, jobId)` | generation reconciliation (moves/deletes/overflow) |
| `index_apply_changes(events)` | watcher/UI change hints |
| `index_query(root, parent?, limit?, offset?)` | paged indexed rows (never the whole index) |
| `index_stats(root)` | aggregate counts by status and kind |
| `index_config(config?)` | read/update exclusion and scheduling policy |
| `index_reset(root)` | explicit, destructive index reset (UI must confirm) |

---

## 4. Testing and performance methodology

Rust unit tests cover: each decision level, unreliable timestamps, rename/move
identity resolution, exclusion rules, version invalidation, work-queue dedup and
backoff, crash recovery of `running` items, directory checkpoint resume,
reconciliation of deleted files, and overflow-triggered full reconciliation.

A benchmark test (ignored by default, run in CI) builds a synthetic tree and
measures **cold** vs **warm** passes with instrumentation counters:

- `metadata_ops` (stat calls), `content_reads` (open/read calls),
  `reanalysed_files`, `db_rows_written`, wall time, peak RSS.

Acceptance: a warm pass with no changes performs **zero** directory reads and
**zero** metadata reads for indexed files; `reanalysed_files == 0`; the index
survives a simulated restart (new `Store` handle); and a second duplicate scan
reuses stored digests instead of re-reading file contents.

Scale targets are verified in CI with a generated tree (100k → 500k entries):
bounded memory, no per-file IPC, and no arbitrary time/file-count *loss* —
budgets only bound a single resumable pass. Windows hardware checks remain
tracked in `ROADMAP.md` §6.7.
