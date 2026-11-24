//! Persistent, incremental filesystem index.
//!
//! The index separates four independently resumable operations: discovery,
//! metadata indexing, content analysis, and reconciliation. It never relies on
//! a single global cursor: directory checkpoints and a durable work queue carry
//! progress across runs, crashes, and application restarts.
//!
//! `docs/filesystem-index.md` describes the decision rules implemented here.
use std::collections::HashMap;
use std::fs;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

use crate::commands::{safe_path, ProgressEvent};

/// Bump whenever the meaning of `classification` changes. Only rows with an
/// older version are re-analysed.
pub const ANALYSIS_VERSION: i64 = 1;
const SCHEMA_VERSION: i64 = 1;

const PRIORITY_USER: i32 = 100;
const PRIORITY_NEW: i32 = 80;
const PRIORITY_MODIFIED: i32 = 70;
const PRIORITY_VERSION: i32 = 60;
const PRIORITY_INTERRUPTED: i32 = 50;
const PRIORITY_HINT: i32 = 40;
const PRIORITY_BACKGROUND: i32 = 10;

// ---------------------------------------------------------------------------
// Configuration and decision model
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexConfig {
    /// Exact directory/file names excluded by design (case-insensitive).
    pub excluded_names: Vec<String>,
    /// Path segments excluded anywhere in a path (e.g. `node_modules`, `.git`).
    pub excluded_segments: Vec<String>,
    /// Extensions excluded from analysis (temporary/lock files only).
    pub excluded_extensions: Vec<String>,
    /// Bound one *pass*. Work is persisted, so a budget never loses progress.
    pub max_items_per_run: usize,
    pub max_millis_per_run: u64,
    pub batch_size: usize,
    pub progress_interval_ms: u64,
    /// How long a metadata verification remains valid.
    pub metadata_recheck_secs: i64,
    pub max_retry_attempts: u32,
    pub retry_base_secs: u64,
    /// Files above this size are classified by metadata, never fully read.
    pub max_content_bytes: u64,
    pub partial_fingerprint_bytes: usize,
    /// Metadata can be unreliable; fingerprint instead of trusting it blindly.
    pub fingerprint_unreliable_timestamps: bool,
    /// Large / opaque formats are classified and given low priority, not ignored.
    pub expensive_extensions: Vec<String>,
}

fn strings(values: &[&str]) -> Vec<String> {
    values.iter().map(|value| (*value).to_string()).collect()
}

impl Default for IndexConfig {
    fn default() -> Self {
        Self {
            excluded_names: strings(&[
                "system volume information",
                "$recycle.bin",
                "$windows.~bt",
                "$windows.~ws",
                "recovery",
                "perflogs",
                "msocache",
                "config.msi",
                "documents and settings",
                "windowsapps",
                "$winreagent",
                "installer",
                "node_modules",
                ".git",
                ".svn",
            ]),
            excluded_segments: strings(&["node_modules", ".git", ".svn", "__pycache__", ".cache"]),
            excluded_extensions: strings(&["tmp", "temp", "lock", "crdownload", "part", "swp"]),
            max_items_per_run: 200_000,
            max_millis_per_run: 25_000,
            batch_size: 500,
            progress_interval_ms: 200,
            metadata_recheck_secs: 3_600,
            max_retry_attempts: 5,
            retry_base_secs: 30,
            max_content_bytes: 512 * 1024 * 1024,
            partial_fingerprint_bytes: 64 * 1024,
            fingerprint_unreliable_timestamps: true,
            expensive_extensions: strings(&[
                "iso", "vhdx", "vhd", "vmdk", "qcow2", "img", "zip", "rar", "7z", "tar", "gz",
                "bz2", "xz", "cab", "msi", "db", "sqlite", "sqlite3", "mdb", "accdb", "bak", "mp4",
                "mkv", "avi", "mov", "wmv", "m4v", "vob", "mp3", "flac", "wav",
            ]),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EntryKind {
    File,
    Directory,
    Link,
}

#[derive(Debug, Clone)]
pub struct ObservedEntry {
    pub path: String,
    pub parent: String,
    pub name: String,
    pub kind: EntryKind,
    pub size_bytes: u64,
    pub modified_ns: i64,
    pub created_ns: Option<i64>,
    pub identity: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Decision {
    Ignore,
    SkipUnchanged,
    VerifyMetadata,
    Analyze,
    Defer,
    Retry,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DecisionOutcome {
    pub decision: Decision,
    pub reason: String,
    pub rule: String,
}

impl DecisionOutcome {
    fn new(decision: Decision, reason: &str, rule: &str) -> Self {
        Self {
            decision,
            reason: reason.to_string(),
            rule: rule.to_string(),
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct DecisionContext<'a> {
    pub generation: i64,
    pub config: &'a IndexConfig,
    pub now: i64,
}

/// Cheap, deterministic exclusion check shared by files and directories.
pub fn exclusion_reason(observed: &ObservedEntry, config: &IndexConfig) -> Option<String> {
    if observed.kind == EntryKind::Link {
        return Some("reparse point is a navigation link".to_string());
    }
    let lower = observed.name.to_ascii_lowercase();
    if config
        .excluded_names
        .iter()
        .any(|name| name.eq_ignore_ascii_case(&lower))
    {
        return Some(format!("excluded name '{lower}'"));
    }
    let path_lower = observed.path.to_ascii_lowercase();
    let segments: Vec<&str> = path_lower.split(['\\', '/']).collect();
    if let Some(segment) = config.excluded_segments.iter().find(|segment| {
        segments
            .iter()
            .any(|part| part.eq_ignore_ascii_case(segment.as_str()))
    }) {
        return Some(format!("excluded path segment '{segment}'"));
    }
    if observed.kind == EntryKind::File {
        if let Some(extension) = lower.rsplit_once('.').map(|(_, ext)| ext) {
            if config
                .excluded_extensions
                .iter()
                .any(|ext| ext.eq_ignore_ascii_case(extension))
            {
                return Some(format!("excluded temporary extension '.{extension}'"));
            }
        }
    }
    None
}

/// The scan decision engine. A file is not reanalysed merely because a scan was
/// started: cached knowledge and cheap metadata come first.
pub fn decide_entry(
    observed: &ObservedEntry,
    known: Option<&FileRow>,
    ctx: &DecisionContext<'_>,
) -> DecisionOutcome {
    if let Some(reason) = exclusion_reason(observed, ctx.config) {
        let rule = if observed.kind == EntryKind::Link {
            "reparse"
        } else {
            "exclusion"
        };
        return DecisionOutcome::new(Decision::Ignore, &reason, rule);
    }
    let known = match known {
        Some(row) => row,
        None => return DecisionOutcome::new(Decision::Analyze, "no index record", "new-path"),
    };
    if known.state == "missing" {
        return DecisionOutcome::new(Decision::Analyze, "previously missing", "new-path");
    }
    if known.analysis_status == "failed" && known.analysis_version == ANALYSIS_VERSION {
        return DecisionOutcome::new(Decision::Retry, "previous analysis failed", "retry");
    }
    if known.analysis_version != ANALYSIS_VERSION {
        return DecisionOutcome::new(
            Decision::Analyze,
            &format!(
                "analysis version {} -> {}",
                known.analysis_version, ANALYSIS_VERSION
            ),
            "version",
        );
    }
    if known.analysis_status == "stale" {
        return DecisionOutcome::new(Decision::Analyze, "marked stale by change hint", "hint");
    }
    // Level 2: cheap metadata comparison. Identity is authoritative when both
    // sides have one; size and modified time are the fallback.
    let identity_changed = match (&known.identity, &observed.identity) {
        (Some(a), Some(b)) => a != b,
        _ => false,
    };
    let metadata_changed = identity_changed
        || known.size_bytes != observed.size_bytes
        || (known.modified_ns != observed.modified_ns
            && !unreliable_time(known.modified_ns)
            && !unreliable_time(observed.modified_ns));
    if metadata_changed {
        return DecisionOutcome::new(
            Decision::Analyze,
            if identity_changed {
                "file identity changed"
            } else {
                "size or timestamp changed"
            },
            "metadata",
        );
    }
    if unreliable_time(observed.modified_ns)
        && ctx.config.fingerprint_unreliable_timestamps
        && known.fingerprint.is_none()
    {
        return DecisionOutcome::new(
            Decision::Analyze,
            "timestamp unreliable and no fingerprint",
            "unreliable-time",
        );
    }
    let verified_age = ctx
        .now
        .saturating_sub(parse_secs(&known.metadata_verified_at));
    if verified_age < ctx.config.metadata_recheck_secs && known.analysis_status == "analyzed" {
        return DecisionOutcome::new(Decision::SkipUnchanged, "indexed and unchanged", "cache");
    }
    DecisionOutcome::new(
        Decision::VerifyMetadata,
        "verification interval elapsed",
        "ttl",
    )
}

/// Directory traversal is checkpoint-based: an unchanged checkpoint is not
/// re-walked. Change hints or a forced rescan re-queue the directory alone.
pub fn decide_directory(
    checkpoint: Option<&DirCheckpoint>,
    ctx: &DecisionContext<'_>,
) -> DecisionOutcome {
    match checkpoint {
        None => DecisionOutcome::new(Decision::Analyze, "new directory", "new-path"),
        Some(dir)
            if dir.state == "unreadable"
                && ctx.now.saturating_sub(parse_secs(&dir.seen_at)) < 3_600 =>
        {
            DecisionOutcome::new(Decision::Ignore, "recently unreadable", "retry-limit")
        }
        Some(dir) if dir.generation == ctx.generation && dir.state == "scanned" => {
            DecisionOutcome::new(Decision::SkipUnchanged, "checkpoint current", "checkpoint")
        }
        Some(dir) => DecisionOutcome::new(
            Decision::VerifyMetadata,
            "directory not current",
            "checkpoint",
        ),
    }
}

/// Pure classification by name and size. No file content is read here.
pub fn classify(path: &str, size_bytes: u64, config: &IndexConfig) -> (String, String) {
    let name = Path::new(path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("");
    let extension = name
        .rsplit_once('.')
        .map(|(_, ext)| ext.to_ascii_lowercase())
        .unwrap_or_default();
    let kind = match extension.as_str() {
        "png" | "jpg" | "jpeg" | "gif" | "webp" | "bmp" | "svg" | "heic" | "tif" | "tiff" => {
            "image"
        }
        "mp4" | "mkv" | "avi" | "mov" | "wmv" | "webm" | "m4v" => "video",
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "m4a" => "audio",
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" | "cab" => "archive",
        "iso" | "vhdx" | "vhd" | "vmdk" | "qcow2" | "img" => "disk-image",
        "db" | "sqlite" | "sqlite3" | "mdb" | "accdb" => "database",
        "exe" | "msi" | "dll" | "so" | "app" => "application",
        "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "odt" => "document",
        "txt" | "csv" | "md" | "log" | "json" | "xml" | "yaml" | "yml" => "text",
        "" => "unknown",
        _ => "binary",
    };
    let expensive = config
        .expensive_extensions
        .iter()
        .any(|ext| ext.eq_ignore_ascii_case(&extension))
        || size_bytes > config.max_content_bytes;
    let policy = if expensive { "sample-only" } else { "standard" };
    let classification = serde_json::json!({
        "kind": kind,
        "policy": policy,
        "extension": extension,
        "sizeClass": if size_bytes > config.max_content_bytes { "large" } else { "standard" },
    })
    .to_string();
    (kind.to_string(), classification)
}

/// Queue priority: large/opaque formats are deferred, never ignored.
pub fn priority_for(
    observed: &ObservedEntry,
    known: Option<&FileRow>,
    config: &IndexConfig,
) -> i32 {
    if let Some(row) = known {
        if row.analysis_status == "failed" {
            return PRIORITY_INTERRUPTED;
        }
        if row.analysis_version != ANALYSIS_VERSION {
            return PRIORITY_VERSION;
        }
        if unreliable_time(row.modified_ns) {
            return PRIORITY_MODIFIED;
        }
    }
    let extension = observed
        .name
        .rsplit_once('.')
        .map(|(_, ext)| ext.to_ascii_lowercase())
        .unwrap_or_default();
    if config
        .expensive_extensions
        .iter()
        .any(|ext| ext.eq_ignore_ascii_case(&extension))
        || observed.size_bytes > config.max_content_bytes
    {
        PRIORITY_BACKGROUND
    } else {
        PRIORITY_NEW
    }
}

fn unreliable_time(ns: i64) -> bool {
    ns <= 0 || ns == i64::MAX
}

fn parse_secs(value: &str) -> i64 {
    value.parse::<i64>().unwrap_or(0)
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn timestamp_ns(time: SystemTime) -> i64 {
    time.duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos().min(i64::MAX as u128) as i64)
        .unwrap_or(0)
}

fn identity_of(metadata: &fs::Metadata) -> Option<String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        Some(format!("{}:{}", metadata.dev(), metadata.ino()))
    }
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        Some(format!(
            "{}:{}",
            metadata.volume_serial_number(),
            metadata.file_index()
        ))
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = metadata;
        None
    }
}

fn is_link(metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;
        metadata.file_type().is_symlink()
            || (metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT) != 0
    }
    #[cfg(not(windows))]
    {
        metadata.file_type().is_symlink()
    }
}

// ---------------------------------------------------------------------------
// Data records
// ---------------------------------------------------------------------------

#[derive(Debug, Clone)]
pub struct FileRow {
    pub path: String,
    pub root: String,
    pub parent: String,
    pub name: String,
    pub extension: String,
    pub content_kind: String,
    pub size_bytes: u64,
    pub modified_ns: i64,
    pub created_ns: Option<i64>,
    pub identity: Option<String>,
    pub discovered_at: String,
    pub metadata_verified_at: String,
    pub content_analyzed_at: Option<String>,
    pub fingerprint: Option<String>,
    pub analysis_status: String,
    pub analysis_version: i64,
    pub classification: String,
    pub generation: i64,
    pub state: String,
}

impl FileRow {
    fn from_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<Self> {
        Ok(Self {
            path: row.get(0)?,
            root: row.get(1)?,
            parent: row.get(2)?,
            name: row.get(3)?,
            extension: row.get(4)?,
            content_kind: row.get(5)?,
            size_bytes: row.get::<_, i64>(6)? as u64,
            modified_ns: row.get(7)?,
            created_ns: row.get(8)?,
            identity: row.get(9)?,
            discovered_at: row.get(10)?,
            metadata_verified_at: row.get(11)?,
            content_analyzed_at: row.get(12)?,
            fingerprint: row.get(13)?,
            analysis_status: row.get(14)?,
            analysis_version: row.get(15)?,
            classification: row.get(16)?,
            generation: row.get(17)?,
            state: row.get(18)?,
        })
    }

    fn from_observed(observed: &ObservedEntry, root: &str, generation: i64, kind: &str) -> Self {
        let now = now_secs().to_string();
        Self {
            path: observed.path.clone(),
            root: root.to_string(),
            parent: observed.parent.clone(),
            name: observed.name.clone(),
            extension: observed
                .name
                .rsplit_once('.')
                .map(|(_, ext)| ext.to_ascii_lowercase())
                .unwrap_or_default(),
            content_kind: kind.to_string(),
            size_bytes: observed.size_bytes,
            modified_ns: observed.modified_ns,
            created_ns: observed.created_ns,
            identity: observed.identity.clone(),
            discovered_at: now.clone(),
            metadata_verified_at: now,
            content_analyzed_at: None,
            fingerprint: None,
            analysis_status: "pending".to_string(),
            analysis_version: 0,
            classification: "{}".to_string(),
            generation,
            state: "present".to_string(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct DirCheckpoint {
    pub path: String,
    pub parent: Option<String>,
    pub depth: i64,
    pub generation: i64,
    pub state: String,
    pub child_count: i64,
    pub reason: Option<String>,
    pub seen_at: String,
}

#[derive(Debug, Clone)]
pub struct RootState {
    pub generation: i64,
    pub status: String,
    pub pending_dirs: i64,
    pub pending_work: i64,
    pub budget_exceeded: bool,
    pub needs_reconciliation: bool,
    pub last_scan_at: Option<String>,
    pub unreadable: i64,
    pub excluded: i64,
    pub reparse: i64,
    pub budget_skips: i64,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexCounts {
    pub discovered: u64,
    pub new: u64,
    pub unchanged: u64,
    pub metadata_verified: u64,
    pub analyze_scheduled: u64,
    pub analyzed: u64,
    pub ignored: u64,
    pub deferred: u64,
    pub failed: u64,
    pub moved: u64,
    pub missing: u64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanReport {
    pub root: String,
    pub generation: i64,
    pub state: String,
    pub fresh: bool,
    pub budget_exceeded: bool,
    pub counts: IndexCounts,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkReport {
    pub processed: usize,
    pub ok: usize,
    pub failed: usize,
    pub reanalysed: usize,
    pub fingerprint_reused: usize,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReconcileReport {
    pub moved: u64,
    pub missing: u64,
    pub dirs_missing: u64,
}

#[derive(Debug, Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeReport {
    pub accepted: usize,
    pub overflow: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexStatus {
    pub root: String,
    pub generation: i64,
    pub status: String,
    pub fresh: bool,
    pub pending_dirs: i64,
    pub pending_work: i64,
    pub last_scan_at: Option<String>,
    pub budget_exceeded: bool,
    pub needs_reconciliation: bool,
    pub counts: IndexCounts,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexedFileDto {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub content_kind: String,
    pub size_bytes: u64,
    pub modified_at: String,
    pub analysis_status: String,
    pub analysis_version: i64,
    pub classification: String,
    pub metadata_verified_at: String,
    pub content_analyzed_at: Option<String>,
    pub fingerprint: Option<String>,
    pub generation: i64,
    pub state: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexStats {
    pub total_files: i64,
    pub total_bytes: i64,
    pub pending_work: i64,
    pub by_status: HashMap<String, i64>,
    pub by_kind: HashMap<String, i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChangeEvent {
    pub path: String,
    pub kind: String,
    pub old_path: Option<String>,
    pub at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotNode {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    #[serde(skip)]
    pub parent: Option<String>,
    pub children: Vec<SnapshotNode>,
    pub depth: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotFile {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkipCountsData {
    pub unreadable: usize,
    pub excluded: usize,
    pub reparse: usize,
    pub budget: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotSkip {
    pub path: String,
    pub reason: String,
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotData {
    pub scanned_bytes: u64,
    pub scanned_items: u64,
    pub tree: Vec<SnapshotNode>,
    pub largest_files: Vec<SnapshotFile>,
    pub largest_folders: Vec<SnapshotFile>,
    pub skip_counts: SkipCountsData,
    pub skipped_locations: Vec<SnapshotSkip>,
    pub is_partial: bool,
    pub state: String,
    pub budget_exceeded: bool,
}

#[derive(Debug, Clone)]
struct WorkItem {
    id: i64,
    path: String,
    kind: String,
    attempts: i32,
}

#[derive(Debug, Clone)]
struct WorkRequest {
    path: String,
    kind: String,
    priority: i32,
}

// ---------------------------------------------------------------------------
// SQLite store
// ---------------------------------------------------------------------------

pub struct Store {
    conn: Connection,
}

impl Store {
    pub fn open(path: &Path) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("index directory: {e}"))?;
        }
        let conn = Connection::open(path).map_err(|e| format!("open index: {e}"))?;
        Self::from_connection(conn)
    }

    pub fn in_memory() -> Result<Self, String> {
        Self::from_connection(Connection::open_in_memory().map_err(|e| format!("open index: {e}"))?)
    }

    fn from_connection(conn: Connection) -> Result<Self, String> {
        // WAL and a busy timeout make concurrent headless/UI writes safe.
        conn.execute_batch(
            "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA synchronous=NORMAL;",
        )
        .map_err(|e| format!("index pragmas: {e}"))?;
        let store = Self { conn };
        store.migrate()?;
        Ok(store)
    }

    fn migrate(&self) -> Result<(), String> {
        self.conn.execute_batch(&format!(
            "CREATE TABLE IF NOT EXISTS index_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS roots (
               root TEXT PRIMARY KEY, generation INTEGER NOT NULL DEFAULT 0,
               status TEXT NOT NULL DEFAULT 'partial', pending_dirs INTEGER NOT NULL DEFAULT 0,
               pending_work INTEGER NOT NULL DEFAULT 0, last_scan_at TEXT,
               scanned_items INTEGER NOT NULL DEFAULT 0, scanned_bytes INTEGER NOT NULL DEFAULT 0,
               budget_exceeded INTEGER NOT NULL DEFAULT 0, needs_reconciliation INTEGER NOT NULL DEFAULT 0,
               unreadable INTEGER NOT NULL DEFAULT 0, excluded INTEGER NOT NULL DEFAULT 0,
               reparse INTEGER NOT NULL DEFAULT 0, budget_skips INTEGER NOT NULL DEFAULT 0
             );
             CREATE TABLE IF NOT EXISTS directories (
               root TEXT NOT NULL, path TEXT NOT NULL, parent TEXT, depth INTEGER NOT NULL DEFAULT 0,
               generation INTEGER NOT NULL DEFAULT 0, state TEXT NOT NULL DEFAULT 'pending',
               child_count INTEGER NOT NULL DEFAULT 0, reason TEXT, seen_at TEXT NOT NULL DEFAULT '0',
               PRIMARY KEY(root, path)
             );
             CREATE TABLE IF NOT EXISTS files (
               path TEXT PRIMARY KEY, root TEXT NOT NULL, parent TEXT NOT NULL, name TEXT NOT NULL,
               extension TEXT NOT NULL, content_kind TEXT NOT NULL DEFAULT 'unknown',
               size_bytes INTEGER NOT NULL DEFAULT 0, modified_ns INTEGER NOT NULL DEFAULT 0,
               created_ns INTEGER, identity TEXT, discovered_at TEXT NOT NULL,
               metadata_verified_at TEXT NOT NULL, content_analyzed_at TEXT, fingerprint TEXT,
               analysis_status TEXT NOT NULL DEFAULT 'pending', analysis_version INTEGER NOT NULL DEFAULT 0,
               classification TEXT NOT NULL DEFAULT '{{}}', generation INTEGER NOT NULL DEFAULT 0,
               state TEXT NOT NULL DEFAULT 'present'
             );
             CREATE INDEX IF NOT EXISTS idx_files_root_parent ON files(root, parent);
             CREATE INDEX IF NOT EXISTS idx_files_root_status ON files(root, analysis_status);
             CREATE INDEX IF NOT EXISTS idx_files_generation ON files(root, generation);
             CREATE INDEX IF NOT EXISTS idx_dirs_pending ON directories(root, state, depth);
             CREATE TABLE IF NOT EXISTS work_queue (
               id INTEGER PRIMARY KEY AUTOINCREMENT, root TEXT NOT NULL, path TEXT NOT NULL,
               kind TEXT NOT NULL, priority INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0,
               state TEXT NOT NULL DEFAULT 'pending', next_run_at TEXT NOT NULL, last_error TEXT,
               UNIQUE(root, path, kind)
             );
             CREATE INDEX IF NOT EXISTS idx_work_claim ON work_queue(root, state, priority, next_run_at);
             CREATE TABLE IF NOT EXISTS scan_skips (
               id INTEGER PRIMARY KEY AUTOINCREMENT, root TEXT NOT NULL, generation INTEGER NOT NULL,
               path TEXT NOT NULL, reason TEXT NOT NULL, kind TEXT NOT NULL
             );
             CREATE TABLE IF NOT EXISTS snapshots (
               root TEXT PRIMARY KEY, generation INTEGER NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL
             );
             INSERT OR IGNORE INTO index_meta(key, value) VALUES('schemaVersion', '{SCHEMA_VERSION}');"
        ))
        .map_err(|e| format!("index schema: {e}"))?;
        let default_config =
            serde_json::to_string(&IndexConfig::default()).map_err(|e| e.to_string())?;
        self.conn
            .execute(
                "INSERT OR IGNORE INTO index_meta(key, value) VALUES('config', ?1)",
                params![default_config],
            )
            .map_err(|e| format!("index config: {e}"))?;
        Ok(())
    }

    pub fn config(&self) -> Result<IndexConfig, String> {
        let value: String = self
            .conn
            .query_row(
                "SELECT value FROM index_meta WHERE key='config'",
                [],
                |row| row.get(0),
            )
            .map_err(|e| format!("read config: {e}"))?;
        serde_json::from_str(&value).map_err(|e| format!("decode config: {e}"))
    }

    pub fn set_config(&self, config: &IndexConfig) -> Result<(), String> {
        let value = serde_json::to_string(config).map_err(|e| e.to_string())?;
        self.conn
            .execute(
                "UPDATE index_meta SET value=?1 WHERE key='config'",
                params![value],
            )
            .map_err(|e| format!("write config: {e}"))?;
        Ok(())
    }

    fn root_state(&self, root: &str) -> Result<Option<RootState>, String> {
        self.conn
            .query_row(
                "SELECT generation, status, pending_dirs, pending_work, budget_exceeded,
                        needs_reconciliation, last_scan_at, unreadable, excluded, reparse, budget_skips
                 FROM roots WHERE root=?1",
                params![root],
                |row| {
                    Ok(RootState {
                        generation: row.get(0)?,
                        status: row.get(1)?,
                        pending_dirs: row.get(2)?,
                        pending_work: row.get(3)?,
                        budget_exceeded: row.get::<_, i64>(4)? != 0,
                        needs_reconciliation: row.get::<_, i64>(5)? != 0,
                        last_scan_at: row.get(6)?,
                        unreadable: row.get(7)?,
                        excluded: row.get(8)?,
                        reparse: row.get(9)?,
                        budget_skips: row.get(10)?,
                    })
                },
            )
            .optional()
            .map_err(|e| format!("root state: {e}"))
    }

    fn ensure_root(&self, root: &str) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO roots(root) VALUES(?1)",
                params![root],
            )
            .map_err(|e| format!("ensure root: {e}"))?;
        Ok(())
    }

    /// Advance the generation unless the index is demonstrably current.
    fn begin_generation(&self, root: &str, force: bool) -> Result<(i64, bool), String> {
        self.ensure_root(root)?;
        let state = self.root_state(root)?.unwrap_or_else(|| RootState {
            generation: 0,
            status: "partial".to_string(),
            pending_dirs: 0,
            pending_work: 0,
            budget_exceeded: false,
            needs_reconciliation: false,
            last_scan_at: None,
            unreadable: 0,
            excluded: 0,
            reparse: 0,
            budget_skips: 0,
        });
        // Pending analysis work is a separate operation: it must not make a
        // complete discovery stale and trigger another filesystem walk.
        let fresh = !force
            && state.status == "complete"
            && state.pending_dirs == 0
            && !state.needs_reconciliation;
        if fresh {
            return Ok((state.generation, true));
        }
        let generation = state.generation + 1;
        let tx = self
            .conn
            .transaction()
            .map_err(|e| format!("begin generation: {e}"))?;
        tx.execute(
            "UPDATE roots SET generation=?2, status='partial', budget_exceeded=0,
             unreadable=0, excluded=0, reparse=0, budget_skips=0, needs_reconciliation=0,
             scanned_items=0, scanned_bytes=0 WHERE root=?1",
            params![root, generation],
        )
        .map_err(|e| format!("reset root: {e}"))?;
        // A forced rescan or an overflow re-walks every directory. Otherwise
        // only directories already queued (pending/stale) are visited.
        if force || state.needs_reconciliation {
            tx.execute(
                "UPDATE directories SET state='pending' WHERE root=?1",
                params![root],
            )
            .map_err(|e| format!("requeue dirs: {e}"))?;
        }
        tx.commit().map_err(|e| format!("commit generation: {e}"))?;
        Ok((generation, false))
    }

    fn seed_root_dir(&self, root: &str, generation: i64) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO directories(root, path, parent, depth, generation, state, seen_at)
                 VALUES(?1, ?1, NULL, 0, ?2, 'pending', '0')",
                params![root, generation],
            )
            .map_err(|e| format!("seed root dir: {e}"))?;
        Ok(())
    }

    fn pending_dirs(&self, root: &str, limit: i64) -> Result<Vec<(String, i64)>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT path, depth FROM directories WHERE root=?1 AND state='pending' ORDER BY depth, path LIMIT ?2")
            .map_err(|e| format!("pending dirs: {e}"))?;
        let rows = stmt
            .query_map(params![root, limit], |row| Ok((row.get(0)?, row.get(1)?)))
            .map_err(|e| format!("pending dirs query: {e}"))?;
        let mut out = Vec::new();
        for row in rows.flatten() {
            out.push(row);
        }
        Ok(out)
    }

    fn dir_checkpoint(&self, root: &str, path: &str) -> Result<Option<DirCheckpoint>, String> {
        self.conn
            .query_row(
                "SELECT path, parent, depth, generation, state, child_count, reason, seen_at
                 FROM directories WHERE root=?1 AND path=?2",
                params![root, path],
                |row| {
                    Ok(DirCheckpoint {
                        path: row.get(0)?,
                        parent: row.get(1)?,
                        depth: row.get(2)?,
                        generation: row.get(3)?,
                        state: row.get(4)?,
                        child_count: row.get(5)?,
                        reason: row.get(6)?,
                        seen_at: row.get(7)?,
                    })
                },
            )
            .optional()
            .map_err(|e| format!("dir checkpoint: {e}"))
    }

    /// One query per directory for child checkpoints, matching `files_in_parent`.
    fn dirs_in_parent(
        &self,
        root: &str,
        parent: &str,
    ) -> Result<HashMap<String, DirCheckpoint>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT path, parent, depth, generation, state, child_count, reason, seen_at
                 FROM directories WHERE root=?1 AND parent=?2",
            )
            .map_err(|e| format!("dirs in parent: {e}"))?;
        let rows = stmt
            .query_map(params![root, parent], |row| {
                Ok(DirCheckpoint {
                    path: row.get(0)?,
                    parent: row.get(1)?,
                    depth: row.get(2)?,
                    generation: row.get(3)?,
                    state: row.get(4)?,
                    child_count: row.get(5)?,
                    reason: row.get(6)?,
                    seen_at: row.get(7)?,
                })
            })
            .map_err(|e| format!("dirs in parent query: {e}"))?;
        let mut out = HashMap::new();
        for row in rows.flatten() {
            out.insert(row.path.clone(), row);
        }
        Ok(out)
    }

    fn mark_analyzed(
        &self,
        path: &str,
        fingerprint: &str,
        content_kind: &str,
        classification: &str,
        version: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE files SET fingerprint=?2, content_kind=?3, classification=?4,
                        analysis_status='analyzed', analysis_version=?5,
                        content_analyzed_at=?6 WHERE path=?1",
                params![
                    path,
                    fingerprint,
                    content_kind,
                    classification,
                    version,
                    now_secs().to_string()
                ],
            )
            .map_err(|e| format!("mark analyzed: {e}"))?;
        Ok(())
    }

    fn mark_dir(
        &self,
        root: &str,
        path: &str,
        parent: Option<&str>,
        depth: i64,
        generation: i64,
        state: &str,
        child_count: i64,
        reason: Option<&str>,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT INTO directories(root, path, parent, depth, generation, state, child_count, reason, seen_at)
                 VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
                 ON CONFLICT(root, path) DO UPDATE SET
                   parent=excluded.parent, depth=excluded.depth, generation=excluded.generation,
                   state=excluded.state, child_count=excluded.child_count,
                   reason=excluded.reason, seen_at=excluded.seen_at",
                params![root, path, parent, depth, generation, state, child_count, reason, now_secs().to_string()],
            )
            .map_err(|e| format!("mark dir: {e}"))?;
        Ok(())
    }

    /// One query per directory instead of one per file.
    fn files_in_parent(
        &self,
        root: &str,
        parent: &str,
    ) -> Result<HashMap<String, FileRow>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT path, root, parent, name, extension, content_kind, size_bytes,
                             modified_ns, created_ns, identity, discovered_at, metadata_verified_at,
                             content_analyzed_at, fingerprint, analysis_status, analysis_version,
                             classification, generation, state
                      FROM files WHERE root=?1 AND parent=?2",
            )
            .map_err(|e| format!("files in parent: {e}"))?;
        let rows = stmt
            .query_map(params![root, parent], FileRow::from_row)
            .map_err(|e| format!("files in parent query: {e}"))?;
        let mut out = HashMap::new();
        for row in rows.flatten() {
            out.insert(row.path.clone(), row);
        }
        Ok(out)
    }

    fn get_file(&self, path: &str) -> Result<Option<FileRow>, String> {
        self.conn
            .query_row(
                "SELECT path, root, parent, name, extension, content_kind, size_bytes,
                        modified_ns, created_ns, identity, discovered_at, metadata_verified_at,
                        content_analyzed_at, fingerprint, analysis_status, analysis_version,
                        classification, generation, state
                 FROM files WHERE path=?1",
                params![path],
                FileRow::from_row,
            )
            .optional()
            .map_err(|e| format!("get file: {e}"))
    }

    fn upsert_files(&self, root: &str, generation: i64, rows: &[FileRow]) -> Result<(), String> {
        if rows.is_empty() {
            return Ok(());
        }
        let tx = self
            .conn
            .transaction()
            .map_err(|e| format!("upsert tx: {e}"))?;
        {
            let mut stmt = tx
                .prepare(
                    "INSERT INTO files (path, root, parent, name, extension, content_kind,
                       size_bytes, modified_ns, created_ns, identity, discovered_at,
                       metadata_verified_at, content_analyzed_at, fingerprint, analysis_status,
                       analysis_version, classification, generation, state)
                     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19)
                     ON CONFLICT(path) DO UPDATE SET
                       root=excluded.root, parent=excluded.parent, name=excluded.name,
                       extension=excluded.extension, content_kind=excluded.content_kind,
                       size_bytes=excluded.size_bytes, modified_ns=excluded.modified_ns,
                       created_ns=excluded.created_ns, identity=excluded.identity,
                       discovered_at=excluded.discovered_at,
                       metadata_verified_at=excluded.metadata_verified_at,
                       content_analyzed_at=excluded.content_analyzed_at,
                       fingerprint=excluded.fingerprint, analysis_status=excluded.analysis_status,
                       analysis_version=excluded.analysis_version,
                       classification=excluded.classification,
                       generation=excluded.generation, state=excluded.state",
                )
                .map_err(|e| format!("upsert prepare: {e}"))?;
            for row in rows {
                stmt.execute(params![
                    row.path,
                    root,
                    row.parent,
                    row.name,
                    row.extension,
                    row.content_kind,
                    row.size_bytes as i64,
                    row.modified_ns,
                    row.created_ns,
                    row.identity,
                    row.discovered_at,
                    row.metadata_verified_at,
                    row.content_analyzed_at,
                    row.fingerprint,
                    row.analysis_status,
                    row.analysis_version,
                    row.classification,
                    generation,
                    row.state,
                ])
                .map_err(|e| format!("upsert row: {e}"))?;
            }
        }
        tx.commit().map_err(|e| format!("upsert commit: {e}"))?;
        let _ = root;
        Ok(())
    }

    fn touch_file(&self, path: &str, generation: i64) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE files SET generation=?2, metadata_verified_at=?3, state='present' WHERE path=?1",
                params![path, generation, now_secs().to_string()],
            )
            .map_err(|e| format!("touch file: {e}"))?;
        Ok(())
    }

    fn update_file_metadata(
        &self,
        observed: &ObservedEntry,
        generation: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE files SET size_bytes=?2, modified_ns=?3, created_ns=?4, identity=?5,
                        generation=?6, metadata_verified_at=?7, state='present' WHERE path=?1",
                params![
                    observed.path,
                    observed.size_bytes as i64,
                    observed.modified_ns,
                    observed.created_ns,
                    observed.identity,
                    generation,
                    now_secs().to_string(),
                ],
            )
            .map_err(|e| format!("update metadata: {e}"))?;
        Ok(())
    }

    fn enqueue_batch(&self, root: &str, requests: &[WorkRequest]) -> Result<(), String> {
        if requests.is_empty() {
            return Ok(());
        }
        let tx = self
            .conn
            .transaction()
            .map_err(|e| format!("queue tx: {e}"))?;
        {
            let mut stmt = tx
                .prepare(
                    "INSERT INTO work_queue(root, path, kind, priority, attempts, state, next_run_at)
                     VALUES(?1,?2,?3,?4,0,'pending',?5)
                     ON CONFLICT(root, path, kind) DO UPDATE SET
                       priority=MAX(work_queue.priority, excluded.priority),
                       attempts=0, state='pending', next_run_at=excluded.next_run_at,
                       last_error=NULL",
                )
                .map_err(|e| format!("queue prepare: {e}"))?;
            for request in requests {
                stmt.execute(params![
                    root,
                    request.path,
                    request.kind,
                    request.priority,
                    now_secs().to_string(),
                ])
                .map_err(|e| format!("queue row: {e}"))?;
            }
        }
        tx.commit().map_err(|e| format!("queue commit: {e}"))?;
        Ok(())
    }

    fn enqueue(&self, root: &str, path: &str, kind: &str, priority: i32) -> Result<(), String> {
        self.enqueue_batch(
            root,
            &[WorkRequest {
                path: path.to_string(),
                kind: kind.to_string(),
                priority,
            }],
        )
    }

    /// Crash recovery: a `running` item from a dead process becomes claimable.
    fn recover_work(&self) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE work_queue SET state='pending' WHERE state='running'",
                [],
            )
            .map_err(|e| format!("recover work: {e}"))?;
        Ok(())
    }

    fn claim_work(&self, root: &str, limit: i64) -> Result<Vec<WorkItem>, String> {
        self.recover_work()?;
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, path, kind, attempts FROM work_queue
                 WHERE root=?1 AND state='pending' AND next_run_at <= ?2
                 ORDER BY priority DESC, next_run_at ASC, id ASC LIMIT ?3",
            )
            .map_err(|e| format!("claim prepare: {e}"))?;
        let rows = stmt
            .query_map(params![root, now_secs().to_string(), limit], |row| {
                Ok(WorkItem {
                    id: row.get(0)?,
                    path: row.get(1)?,
                    kind: row.get(2)?,
                    attempts: row.get(3)?,
                })
            })
            .map_err(|e| format!("claim query: {e}"))?;
        let items: Vec<WorkItem> = rows.flatten().collect();
        for item in &items {
            self.conn
                .execute(
                    "UPDATE work_queue SET state='running' WHERE id=?1",
                    params![item.id],
                )
                .map_err(|e| format!("claim mark: {e}"))?;
        }
        Ok(items)
    }

    fn finish_work(
        &self,
        item: &WorkItem,
        ok: bool,
        error: Option<&str>,
        cfg: &IndexConfig,
    ) -> Result<(), String> {
        let attempts = item.attempts + 1;
        let state = if ok {
            "done"
        } else if attempts >= cfg.max_retry_attempts as i32 {
            "failed"
        } else {
            "pending"
        };
        let backoff = cfg
            .retry_base_secs
            .saturating_mul(1u64 << attempts.min(10))
            .min(3_600);
        let next = now_secs() + if ok { 0 } else { backoff as i64 };
        self.conn
            .execute(
                "UPDATE work_queue SET state=?2, attempts=?3, last_error=?4, next_run_at=?5 WHERE id=?1",
                params![item.id, state, attempts, error, next.to_string()],
            )
            .map_err(|e| format!("finish work: {e}"))?;
        Ok(())
    }

    fn record_skip(
        &self,
        root: &str,
        generation: i64,
        path: &str,
        reason: &str,
        kind: &str,
    ) -> Result<(), String> {
        let counter = match kind {
            "unreadable" => "unreadable",
            "excluded" => "excluded",
            "reparse" => "reparse",
            _ => "budget_skips",
        };
        self.conn
            .execute(
                &format!("UPDATE roots SET {counter}={counter}+1 WHERE root=?1"),
                params![root],
            )
            .map_err(|e| format!("skip counter: {e}"))?;
        let samples: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM scan_skips WHERE root=?1",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        if samples < 200 {
            self.conn
                .execute(
                    "INSERT INTO scan_skips(root, generation, path, reason, kind) VALUES(?1,?2,?3,?4,?5)",
                    params![root, generation, path, reason, kind],
                )
                .map_err(|e| format!("skip sample: {e}"))?;
        }
        Ok(())
    }

    fn queue_counts(&self, root: &str) -> Result<(i64, i64), String> {
        let pending_dirs: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM directories WHERE root=?1 AND state='pending'",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        let pending_work: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM work_queue WHERE root=?1 AND state IN ('pending','running')",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        Ok((pending_dirs, pending_work))
    }

    /// Refresh denormalized queue counters after work has been processed.
    pub fn refresh_queue_counts(&self, root: &str) -> Result<(), String> {
        let (pending_dirs, pending_work) = self.queue_counts(root)?;
        self.conn
            .execute(
                "UPDATE roots SET pending_dirs=?2, pending_work=?3 WHERE root=?1",
                params![root, pending_dirs, pending_work],
            )
            .map_err(|e| format!("refresh queue counts: {e}"))?;
        Ok(())
    }

    fn finish_generation(&self, root: &str, generation: i64, state: &str) -> Result<(), String> {
        let (pending_dirs, pending_work) = self.queue_counts(root)?;
        self.conn
            .execute(
                "UPDATE roots SET status=?2, pending_dirs=?3, pending_work=?4,
                        last_scan_at=?5 WHERE root=?1",
                params![
                    root,
                    state,
                    pending_dirs,
                    pending_work,
                    now_secs().to_string()
                ],
            )
            .map_err(|e| format!("finish generation: {e}"))?;
        let _ = generation;
        Ok(())
    }

    fn set_budget(&self, root: &str, exceeded: bool, counts: &IndexCounts) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE roots SET budget_exceeded=?2, scanned_items=?3, scanned_bytes=?4 WHERE root=?1",
                params![root, exceeded as i64, counts.discovered as i64, 0i64],
            )
            .map_err(|e| format!("set budget: {e}"))?;
        Ok(())
    }

    pub fn status(&self, root: &str) -> Result<Option<IndexStatus>, String> {
        let state = match self.root_state(root)? {
            Some(state) => state,
            None => return Ok(None),
        };
        let counts = self.counts(root)?;
        let fresh = state.status == "complete"
            && state.pending_dirs == 0
            && !state.needs_reconciliation;
        Ok(Some(IndexStatus {
            root: root.to_string(),
            generation: state.generation,
            status: state.status,
            fresh,
            pending_dirs: state.pending_dirs,
            pending_work: state.pending_work,
            last_scan_at: state.last_scan_at,
            budget_exceeded: state.budget_exceeded,
            needs_reconciliation: state.needs_reconciliation,
            counts,
        }))
    }

    fn counts(&self, root: &str) -> Result<IndexCounts, String> {
        let unreadable = self.count_skip(root, "unreadable")?;
        let excluded = self.count_skip(root, "excluded")?;
        let reparse = self.count_skip(root, "reparse")?;
        let budget = self.count_skip(root, "budget")?;
        let analyzed: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE root=?1 AND analysis_status='analyzed'",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        let failed: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE root=?1 AND analysis_status='failed'",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        let files: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE root=?1 AND state='present'",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        Ok(IndexCounts {
            discovered: (files + unreadable + excluded + reparse + budget) as u64,
            ignored: (excluded + reparse) as u64,
            analyzed: analyzed as u64,
            failed: failed as u64,
            ..IndexCounts::default()
        })
    }

    fn count_skip(&self, root: &str, kind: &str) -> Result<i64, String> {
        let column = match kind {
            "unreadable" => "unreadable",
            "excluded" => "excluded",
            "reparse" => "reparse",
            _ => "budget_skips",
        };
        let value: i64 = self
            .conn
            .query_row(
                &format!("SELECT {column} FROM roots WHERE root=?1"),
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        Ok(value)
    }

    pub fn stats(&self, root: &str) -> Result<IndexStats, String> {
        let (total_files, total_bytes): (i64, i64) = self
            .conn
            .query_row(
                "SELECT COUNT(*), COALESCE(SUM(size_bytes),0) FROM files WHERE root=?1 AND state='present'",
                params![root],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap_or((0, 0));
        let pending_work: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM work_queue WHERE root=?1 AND state IN ('pending','running')",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        let mut by_status = HashMap::new();
        let mut stmt = self
            .conn
            .prepare("SELECT analysis_status, COUNT(*) FROM files WHERE root=?1 GROUP BY analysis_status")
            .map_err(|e| format!("stats status: {e}"))?;
        for row in stmt
            .query_map(params![root], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            })
            .map_err(|e| format!("stats status query: {e}"))?
            .flatten()
        {
            by_status.insert(row.0, row.1);
        }
        let mut by_kind = HashMap::new();
        let mut stmt = self
            .conn
            .prepare("SELECT content_kind, COUNT(*) FROM files WHERE root=?1 GROUP BY content_kind")
            .map_err(|e| format!("stats kind: {e}"))?;
        for row in stmt
            .query_map(params![root], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
            })
            .map_err(|e| format!("stats kind query: {e}"))?
            .flatten()
        {
            by_kind.insert(row.0, row.1);
        }
        Ok(IndexStats {
            total_files,
            total_bytes,
            pending_work,
            by_status,
            by_kind,
        })
    }

    pub fn query_files(
        &self,
        root: &str,
        parent: Option<&str>,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<IndexedFileDto>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT path, name, extension, content_kind, size_bytes, modified_ns,
                        analysis_status, analysis_version, classification, metadata_verified_at,
                        content_analyzed_at, fingerprint, generation, state
                 FROM files WHERE root=?1 AND (?2 IS NULL OR parent=?2)
                 ORDER BY path LIMIT ?3 OFFSET ?4",
            )
            .map_err(|e| format!("query prepare: {e}"))?;
        let rows = stmt
            .query_map(params![root, parent, limit, offset], |row| {
                Ok(IndexedFileDto {
                    path: row.get(0)?,
                    name: row.get(1)?,
                    extension: row.get(2)?,
                    content_kind: row.get(3)?,
                    size_bytes: row.get::<_, i64>(4)? as u64,
                    modified_at: row.get::<_, i64>(5)?.to_string(),
                    analysis_status: row.get(6)?,
                    analysis_version: row.get(7)?,
                    classification: row.get(8)?,
                    metadata_verified_at: row.get(9)?,
                    content_analyzed_at: row.get(10)?,
                    fingerprint: row.get(11)?,
                    generation: row.get(12)?,
                    state: row.get(13)?,
                })
            })
            .map_err(|e| format!("query files: {e}"))?;
        Ok(rows.flatten().collect())
    }

    fn save_snapshot(
        &self,
        root: &str,
        generation: i64,
        snapshot: &SnapshotData,
    ) -> Result<(), String> {
        let payload = serde_json::to_string(snapshot).map_err(|e| e.to_string())?;
        self.conn
            .execute(
                "INSERT INTO snapshots(root, generation, payload, updated_at) VALUES(?1,?2,?3,?4)
                 ON CONFLICT(root) DO UPDATE SET generation=excluded.generation,
                 payload=excluded.payload, updated_at=excluded.updated_at",
                params![root, generation, payload, now_secs().to_string()],
            )
            .map_err(|e| format!("save snapshot: {e}"))?;
        Ok(())
    }

    pub fn load_snapshot(&self, root: &str) -> Result<Option<SnapshotData>, String> {
        let payload: Option<String> = self
            .conn
            .query_row(
                "SELECT payload FROM snapshots WHERE root=?1",
                params![root],
                |row| row.get(0),
            )
            .optional()
            .map_err(|e| format!("load snapshot: {e}"))?;
        match payload {
            Some(value) => serde_json::from_str(&value)
                .map(Some)
                .map_err(|e| format!("decode snapshot: {e}")),
            None => Ok(None),
        }
    }

    pub fn build_snapshot(
        &self,
        root: &str,
        max_depth: i64,
        top_n: usize,
    ) -> Result<SnapshotData, String> {
        let state = self.root_state(root)?.unwrap_or_else(|| RootState {
            generation: 0,
            status: "partial".to_string(),
            pending_dirs: 0,
            pending_work: 0,
            budget_exceeded: false,
            needs_reconciliation: false,
            last_scan_at: None,
            unreadable: 0,
            excluded: 0,
            reparse: 0,
            budget_skips: 0,
        });
        // Direct file bytes per parent, aggregated in SQL (no per-file rows in Rust).
        let mut totals: HashMap<String, u64> = HashMap::new();
        let mut stmt = self
            .conn
            .prepare("SELECT parent, COALESCE(SUM(size_bytes),0) FROM files WHERE root=?1 AND state='present' GROUP BY parent")
            .map_err(|e| format!("snapshot totals: {e}"))?;
        for row in stmt
            .query_map(params![root], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)? as u64))
            })
            .map_err(|e| format!("snapshot totals query: {e}"))?
            .flatten()
        {
            totals.insert(row.0, row.1);
        }
        let mut dir_rows: Vec<(String, Option<String>, String, i64)> = Vec::new();
        let mut stmt = self
            .conn
            .prepare("SELECT path, parent, name, depth FROM directories WHERE root=?1 AND state!='missing' AND depth<=?2")
            .map_err(|e| format!("snapshot dirs: {e}"))?;
        for row in stmt
            .query_map(params![root, max_depth], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            })
            .map_err(|e| format!("snapshot dirs query: {e}"))?
            .flatten()
        {
            dir_rows.push(row);
        }
        let mut nodes: HashMap<String, SnapshotNode> = HashMap::new();
        for (path, parent, name, depth) in &dir_rows {
            nodes.insert(
                path.clone(),
                SnapshotNode {
                    name: name.clone(),
                    path: path.clone(),
                    size_bytes: 0,
                    parent: parent.clone(),
                    children: Vec::new(),
                    depth: *depth,
                },
            );
        }
        for (parent, bytes) in totals {
            if let Some(node) = nodes.get_mut(&parent) {
                node.size_bytes += bytes;
            }
        }
        let mut order: Vec<(String, i64)> = dir_rows
            .iter()
            .map(|(p, _, _, d)| (p.clone(), *d))
            .collect();
        order.sort_by(|a, b| b.1.cmp(&a.1));
        for (path, _) in order {
            let total = match nodes.get(&path) {
                Some(node) => {
                    node.size_bytes + node.children.iter().map(|c| c.size_bytes).sum::<u64>()
                }
                None => continue,
            };
            let parent = nodes.get(&path).and_then(|node| node.parent.clone());
            if let Some(node) = nodes.get_mut(&path) {
                node.size_bytes = total;
            }
            if let Some(parent) = parent {
                let child = nodes[&path].clone();
                if let Some(parent_node) = nodes.get_mut(&parent) {
                    parent_node.children.push(child);
                }
            }
        }
        let mut tree: Vec<SnapshotNode> = nodes
            .into_values()
            .filter(|node| node.parent.as_deref() == Some(root) || node.depth == 0)
            .collect();
        for node in &mut tree {
            trim_node(node, max_depth, 40);
        }
        tree.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        tree.truncate(top_n);

        let mut largest_files = Vec::new();
        let mut stmt = self
            .conn
            .prepare("SELECT name, path, size_bytes, modified_ns FROM files WHERE root=?1 AND state='present' ORDER BY size_bytes DESC LIMIT ?2")
            .map_err(|e| format!("snapshot files: {e}"))?;
        for row in stmt
            .query_map(params![root, top_n as i64], |row| {
                Ok(SnapshotFile {
                    name: row.get(0)?,
                    path: row.get(1)?,
                    size_bytes: row.get::<_, i64>(2)? as u64,
                    modified_at: row.get::<_, i64>(3)?.to_string(),
                })
            })
            .map_err(|e| format!("snapshot files query: {e}"))?
            .flatten()
        {
            largest_files.push(row);
        }

        // Flatten the directory tree again for the folders list.
        let mut folders: Vec<SnapshotNode> = Vec::new();
        for node in &tree {
            collect_nodes(node, &mut folders);
        }
        folders.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        let largest_folders = folders
            .into_iter()
            .take(top_n)
            .map(|node| SnapshotFile {
                name: node.name,
                path: node.path,
                size_bytes: node.size_bytes,
                modified_at: "0".to_string(),
            })
            .collect();

        let mut skipped_locations = Vec::new();
        let mut stmt = self
            .conn
            .prepare(
                "SELECT path, reason, kind FROM scan_skips WHERE root=?1 ORDER BY id DESC LIMIT 25",
            )
            .map_err(|e| format!("snapshot skips: {e}"))?;
        for row in stmt
            .query_map(params![root], |row| {
                Ok(SnapshotSkip {
                    path: row.get(0)?,
                    reason: row.get(1)?,
                    kind: row.get(2)?,
                })
            })
            .map_err(|e| format!("snapshot skips query: {e}"))?
            .flatten()
        {
            skipped_locations.push(row);
        }
        let scanned_bytes: i64 = self
            .conn
            .query_row(
                "SELECT COALESCE(SUM(size_bytes),0) FROM files WHERE root=?1 AND state='present'",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        let scanned_items: i64 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE root=?1 AND state='present'",
                params![root],
                |row| row.get(0),
            )
            .unwrap_or(0);
        Ok(SnapshotData {
            scanned_bytes: scanned_bytes as u64,
            scanned_items: scanned_items as u64,
            tree,
            largest_files,
            largest_folders,
            skip_counts: SkipCountsData {
                unreadable: state.unreadable as usize,
                excluded: state.excluded as usize,
                reparse: state.reparse as usize,
                budget: state.budget_skips as usize,
            },
            skipped_locations,
            is_partial: state.unreadable > 0,
            state: state.status,
            budget_exceeded: state.budget_exceeded,
        })
    }

    fn reconcile(&self, root: &str, generation: i64) -> Result<ReconcileReport, String> {
        let mut report = ReconcileReport::default();
        let mut current_identities: HashMap<String, String> = HashMap::new();
        let mut stmt = self
            .conn
            .prepare(
                "SELECT f.identity, f.path FROM files f
                 JOIN directories d ON d.root=f.root AND d.path=f.parent
                 WHERE f.root=?1 AND f.generation=?2 AND f.state='present'
                   AND f.identity IS NOT NULL AND d.generation=?2",
            )
            .map_err(|e| format!("reconcile current: {e}"))?;
        for row in stmt
            .query_map(params![root, generation], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .map_err(|e| format!("reconcile current query: {e}"))?
            .flatten()
        {
            current_identities.entry(row.0).or_insert(row.1);
        }
        let mut stale: Vec<(String, Option<String>, String)> = Vec::new();
        // Only files whose parent directory was actually re-scanned in this
        // generation can be judged missing. Partial passes leave other branches
        // untouched instead of misreporting them as deletions.
        let mut stmt = self
            .conn
            .prepare(
                "SELECT f.path, f.identity, f.name FROM files f
                 JOIN directories d ON d.root=f.root AND d.path=f.parent
                 WHERE f.root=?1 AND f.generation<?2 AND f.state='present'
                   AND d.generation=?2 AND d.state!='missing'",
            )
            .map_err(|e| format!("reconcile stale: {e}"))?;
        for row in stmt
            .query_map(params![root, generation], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, String>(2)?,
                ))
            })
            .map_err(|e| format!("reconcile stale query: {e}"))?
            .flatten()
        {
            stale.push(row);
        }
        for (path, identity, name) in stale {
            let moved_to = identity
                .as_ref()
                .and_then(|id| current_identities.get(id))
                .cloned();
            let (state, reason) = match moved_to {
                Some(new_path) => {
                    report.moved += 1;
                    ("moved", format!("renamed/moved to {new_path}"))
                }
                None => {
                    report.missing += 1;
                    (
                        "missing",
                        format!("not observed in generation {generation} (was {name})"),
                    )
                }
            };
            self.conn
                .execute(
                    "UPDATE files SET state=?2, analysis_status='stale' WHERE path=?1",
                    params![path, state],
                )
                .map_err(|e| format!("reconcile update: {e}"))?;
            if report.moved <= 200 {
                self.conn
                    .execute(
                        "INSERT INTO scan_skips(root, generation, path, reason, kind) VALUES(?1,?2,?3,?4,'excluded')",
                        params![root, generation, path, reason],
                    )
                    .map_err(|e| format!("reconcile note: {e}"))?;
            }
        }
        let dirs_missing = self
            .conn
            .execute(
                "UPDATE directories SET state='missing'
                 WHERE root=?1 AND generation<?2 AND state!='missing'
                   AND parent IN (SELECT path FROM directories WHERE root=?1 AND generation=?2)",
                params![root, generation],
            )
            .map_err(|e| format!("reconcile dirs: {e}"))?;
        report.dirs_missing = dirs_missing as u64;
        Ok(report)
    }

    fn mark_stale_paths(&self, root: &str, events: &[ChangeEvent]) -> Result<ChangeReport, String> {
        let mut report = ChangeReport::default();
        let tx = self
            .conn
            .transaction()
            .map_err(|e| format!("changes tx: {e}"))?;
        for event in events {
            let path = event.path.trim();
            if path.is_empty() {
                continue;
            }
            report.accepted += 1;
            match event.kind.as_str() {
                "overflow" => {
                    tx.execute(
                        "UPDATE roots SET needs_reconciliation=1 WHERE root=?1",
                        params![root],
                    )
                    .map_err(|e| format!("overflow flag: {e}"))?;
                    report.overflow = true;
                }
                "deleted" => {
                    tx.execute(
                        "UPDATE files SET state='missing', analysis_status='stale' WHERE path=?1",
                        params![path],
                    )
                    .map_err(|e| format!("deleted file: {e}"))?;
                    tx.execute(
                        "DELETE FROM work_queue WHERE path=?1 AND state='pending'",
                        params![path],
                    )
                    .map_err(|e| format!("deleted work: {e}"))?;
                }
                "renamed" => {
                    if let Some(old) = event.old_path.as_deref() {
                        tx.execute(
                            "UPDATE files SET state='missing', analysis_status='stale' WHERE path=?1",
                            params![old],
                        )
                        .map_err(|e| format!("renamed old: {e}"))?;
                    }
                    tx.execute(
                        "UPDATE files SET analysis_status='stale', state='present' WHERE path=?1",
                        params![path],
                    )
                    .map_err(|e| format!("renamed new: {e}"))?;
                }
                _ => {
                    // created / modified: a hint, not truth. Mark stale and let
                    // level-2 metadata verification decide what really changed.
                    tx.execute(
                        "UPDATE files SET analysis_status='stale' WHERE path=?1",
                        params![path],
                    )
                    .map_err(|e| format!("stale file: {e}"))?;
                }
            }
            let parent = Path::new(path)
                .parent()
                .and_then(|p| p.to_str())
                .unwrap_or(root);
            tx.execute(
                "UPDATE directories SET state='pending' WHERE root=?1 AND path=?2",
                params![root, parent],
            )
            .map_err(|e| format!("stale parent: {e}"))?;
            let priority = if event.kind == "created" || event.kind == "modified" {
                PRIORITY_HINT
            } else {
                PRIORITY_BACKGROUND
            };
            let now = now_secs().to_string();
            tx.execute(
                "INSERT INTO work_queue(root, path, kind, priority, attempts, state, next_run_at)
                 VALUES(?1,?2,'metadata_verify',?3,0,'pending',?4)
                 ON CONFLICT(root, path, kind) DO UPDATE SET
                   priority=MAX(work_queue.priority, excluded.priority), state='pending',
                   attempts=0, next_run_at=excluded.next_run_at",
                params![root, path, priority, now],
            )
            .map_err(|e| format!("hint work: {e}"))?;
        }
        tx.commit().map_err(|e| format!("changes commit: {e}"))?;
        Ok(report)
    }

    fn reset_root(&self, root: &str) -> Result<(), String> {
        let tx = self
            .conn
            .transaction()
            .map_err(|e| format!("reset tx: {e}"))?;
        for table in [
            "files",
            "directories",
            "work_queue",
            "scan_skips",
            "snapshots",
        ] {
            tx.execute(&format!("DELETE FROM {table} WHERE root=?1"), params![root])
                .map_err(|e| format!("reset {table}: {e}"))?;
        }
        tx.execute("DELETE FROM roots WHERE root=?1", params![root])
            .map_err(|e| format!("reset roots: {e}"))?;
        tx.commit().map_err(|e| format!("reset commit: {e}"))?;
        Ok(())
    }
}

fn trim_node(node: &mut SnapshotNode, max_depth: i64, max_children: usize) {
    if node.depth >= max_depth {
        node.children.clear();
        return;
    }
    for child in &mut node.children {
        trim_node(child, max_depth, max_children);
    }
    node.children
        .sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    node.children.truncate(max_children);
}

fn collect_nodes(node: &SnapshotNode, out: &mut Vec<SnapshotNode>) {
    out.push(node.clone());
    for child in &node.children {
        collect_nodes(child, out);
    }
}

fn observed_from(root: &str, parent: &str, path: &Path, metadata: &fs::Metadata) -> ObservedEntry {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    let kind = if is_link(metadata) {
        EntryKind::Link
    } else if metadata.is_dir() {
        EntryKind::Directory
    } else {
        EntryKind::File
    };
    ObservedEntry {
        path: path.to_string_lossy().into_owned(),
        parent: parent.to_string(),
        name,
        kind,
        size_bytes: metadata.len(),
        modified_ns: metadata.modified().map(timestamp_ns).unwrap_or(0),
        created_ns: metadata.created().ok().map(timestamp_ns),
        identity: identity_of(metadata),
    }
}

fn emit_progress(
    app: Option<&AppHandle>,
    job_id: &str,
    root: &str,
    generation: i64,
    phase: &str,
    counts: &IndexCounts,
    budget_exceeded: bool,
) {
    if let Some(app) = app {
        let payload = serde_json::json!({
            "jobId": job_id,
            "root": root,
            "generation": generation,
            "phase": phase,
            "counts": counts,
            "budgetExceeded": budget_exceeded,
        });
        let _ = app.emit("zendisk://index-progress", payload);
        // Preserve the existing scan-progress event for the current UI.
        let _ = app.emit(
            "zendisk://scan-progress",
            ProgressEvent {
                job_id: job_id.to_string(),
                scanned_bytes: counts.discovered,
                scanned_items: counts.discovered as usize,
            },
        );
    }
}

// ---------------------------------------------------------------------------
// Independently resumable operations
// ---------------------------------------------------------------------------

/// Discovery + metadata indexing. A warm, unchanged root performs zero
/// filesystem reads and returns immediately with `fresh: true`.
pub fn discover(
    store: &Store,
    root: &str,
    job_id: &str,
    force: bool,
    cancel: &AtomicBool,
    paused: &AtomicBool,
    app: Option<&AppHandle>,
) -> Result<ScanReport, String> {
    let root_path = safe_path(root).map_err(|e| e.message)?;
    let root_key = root_path.to_string_lossy().into_owned();
    let config = store.config()?;
    let (generation, fresh) = store.begin_generation(&root_key, force)?;
    let mut counts = IndexCounts::default();
    if fresh {
        let report = ScanReport {
            root: root_key,
            generation,
            state: "fresh".into(),
            fresh: true,
            budget_exceeded: false,
            counts,
        };
        emit_progress(
            app,
            job_id,
            &report.root,
            generation,
            "fresh",
            &counts,
            false,
        );
        return Ok(report);
    }
    store.seed_root_dir(&root_key, generation)?;
    let mut deadline = Instant::now() + Duration::from_millis(config.max_millis_per_run);
    let mut last_emit = Instant::now();
    let mut budget_exceeded = false;
    let mut cancelled = false;

    'outer: loop {
        if cancel.load(Ordering::Relaxed) {
            cancelled = true;
            break;
        }
        let directories = store.pending_dirs(&root_key, 32)?;
        if directories.is_empty() {
            break;
        }
        for (dir, depth) in directories {
            if cancel.load(Ordering::Relaxed) {
                cancelled = true;
                break 'outer;
            }
            if paused.load(Ordering::Relaxed) {
                let paused_at = Instant::now();
                while paused.load(Ordering::Relaxed) {
                    if cancel.load(Ordering::Relaxed) {
                        cancelled = true;
                        break;
                    }
                    std::thread::sleep(Duration::from_millis(50));
                }
                deadline += paused_at.elapsed();
                if cancelled {
                    break 'outer;
                }
            }
            if counts.discovered as usize >= config.max_items_per_run || Instant::now() >= deadline
            {
                budget_exceeded = true;
                store.record_skip(&root_key, generation, &dir, "pass budget reached", "budget")?;
                break 'outer;
            }
            let dir_parent = store
                .dir_checkpoint(&root_key, &dir)?
                .and_then(|checkpoint| checkpoint.parent);
            let entries = match fs::read_dir(&dir) {
                Ok(entries) => entries,
                Err(error) => {
                    store.record_skip(
                        &root_key,
                        generation,
                        &dir,
                        &format!("folder unreadable: {error}"),
                        "unreadable",
                    )?;
                    store.mark_dir(
                        &root_key,
                        &dir,
                        dir_parent.as_deref(),
                        depth,
                        generation,
                        "unreadable",
                        0,
                        Some(&error.to_string()),
                    )?;
                    continue;
                }
            };
            let known_files = store.files_in_parent(&root_key, &dir)?;
            let child_checkpoints = store.dirs_in_parent(&root_key, &dir)?;
            let ctx = DecisionContext {
                generation,
                config: &config,
                now: now_secs(),
            };
            let mut staged: Vec<FileRow> = Vec::new();
            let mut enqueued: Vec<WorkRequest> = Vec::new();
            let mut child_count = 0i64;
            for entry in entries.flatten() {
                counts.discovered += 1;
                let path = entry.path();
                let metadata = match fs::symlink_metadata(&path) {
                    Ok(metadata) => metadata,
                    Err(error) => {
                        store.record_skip(
                            &root_key,
                            generation,
                            &path.to_string_lossy(),
                            &format!("metadata unavailable: {error}"),
                            "unreadable",
                        )?;
                        continue;
                    }
                };
                let observed = observed_from(&root_key, &dir, &path, &metadata);
                if let Some(reason) = exclusion_reason(&observed, &config) {
                    counts.ignored += 1;
                    let kind = if observed.kind == EntryKind::Link {
                        "reparse"
                    } else {
                        "excluded"
                    };
                    store.record_skip(&root_key, generation, &observed.path, &reason, kind)?;
                    continue;
                }
                match observed.kind {
                    EntryKind::Directory => {
                        child_count += 1;
                        match decide_directory(child_checkpoints.get(&observed.path), &ctx) {
                            Decision::Ignore | Decision::SkipUnchanged => {
                                store.mark_dir(
                                    &root_key,
                                    &observed.path,
                                    Some(dir.as_str()),
                                    depth + 1,
                                    generation,
                                    "scanned",
                                    0,
                                    None,
                                )?;
                            }
                            _ => {
                                store.mark_dir(
                                    &root_key,
                                    &observed.path,
                                    Some(dir.as_str()),
                                    depth + 1,
                                    generation,
                                    "pending",
                                    0,
                                    None,
                                )?;
                            }
                        }
                    }
                    EntryKind::File => {
                        let known = known_files.get(&observed.path);
                        let outcome = decide_entry(&observed, known, &ctx);
                        match outcome.decision {
                            Decision::Ignore => {
                                counts.ignored += 1;
                                store.record_skip(
                                    &root_key,
                                    generation,
                                    &observed.path,
                                    &outcome.reason,
                                    "excluded",
                                )?;
                            }
                            Decision::SkipUnchanged => {
                                counts.unchanged += 1;
                                store.touch_file(&observed.path, generation)?;
                            }
                            Decision::VerifyMetadata => {
                                counts.metadata_verified += 1;
                                store.update_file_metadata(&observed, generation)?;
                            }
                            Decision::Analyze | Decision::Retry => {
                                if known.is_none() {
                                    counts.new += 1;
                                }
                                counts.analyze_scheduled += 1;
                                let mut row = known.cloned().unwrap_or_else(|| {
                                    FileRow::from_observed(
                                        &observed, &root_key, generation, "unknown",
                                    )
                                });
                                row.generation = generation;
                                row.state = "present".to_string();
                                row.modified_ns = observed.modified_ns;
                                row.size_bytes = observed.size_bytes;
                                row.identity = observed.identity.clone();
                                row.analysis_status = "pending".to_string();
                                staged.push(row);
                                enqueued.push(WorkRequest {
                                    path: observed.path.clone(),
                                    kind: "content_analyze".to_string(),
                                    priority: priority_for(&observed, known, &config),
                                });
                            }
                            Decision::Defer => {
                                counts.deferred += 1;
                                let mut row = known.cloned().unwrap_or_else(|| {
                                    FileRow::from_observed(
                                        &observed, &root_key, generation, "unknown",
                                    )
                                });
                                row.generation = generation;
                                row.state = "present".to_string();
                                staged.push(row);
                                enqueued.push(WorkRequest {
                                    path: observed.path.clone(),
                                    kind: "content_analyze".to_string(),
                                    priority: PRIORITY_BACKGROUND,
                                });
                            }
                        }
                    }
                    EntryKind::Link => unreachable!("links are excluded above"),
                }
                if staged.len() >= config.batch_size {
                    store.upsert_files(&root_key, generation, &staged)?;
                    staged.clear();
                    store.enqueue_batch(&root_key, &enqueued)?;
                    enqueued.clear();
                }
            }
            store.upsert_files(&root_key, generation, &staged)?;
            store.enqueue_batch(&root_key, &enqueued)?;
            store.mark_dir(
                &root_key,
                &dir,
                dir_parent.as_deref(),
                depth,
                generation,
                "scanned",
                child_count,
                None,
            )?;
            if last_emit.elapsed() >= Duration::from_millis(config.progress_interval_ms) {
                emit_progress(
                    app,
                    job_id,
                    &root_key,
                    generation,
                    "discover",
                    &counts,
                    budget_exceeded,
                );
                last_emit = Instant::now();
            }
        }
    }
    store.set_budget(&root_key, budget_exceeded, &counts)?;
    let (pending_dirs, _) = store.queue_counts(&root_key)?;
    let state = if cancelled {
        "cancelled"
    } else if budget_exceeded || pending_dirs > 0 {
        "partial"
    } else {
        let reconcile_report = store.reconcile(&root_key, generation)?;
        counts.moved = reconcile_report.moved;
        counts.missing = reconcile_report.missing;
        "completed"
    };
    store.finish_generation(&root_key, generation, state)?;
    if state == "completed" {
        let snapshot = store.build_snapshot(&root_key, 3, 20)?;
        store.save_snapshot(&root_key, generation, &snapshot)?;
    }
    emit_progress(
        app,
        job_id,
        &root_key,
        generation,
        "done",
        &counts,
        budget_exceeded,
    );
    Ok(ScanReport {
        root: root_key,
        generation,
        state: state.to_string(),
        fresh: false,
        budget_exceeded,
        counts,
    })
}

/// Process a bounded slice of the durable work queue. Metadata verification is
/// a cheap stat; content analysis uses a partial fingerprint before any full
/// read and never recomputes classification for unchanged content.
pub fn process_work(
    store: &Store,
    root: &str,
    limit: usize,
    cancel: &AtomicBool,
    app: Option<&AppHandle>,
) -> Result<WorkReport, String> {
    let config = store.config()?;
    let mut report = WorkReport::default();
    let items = store.claim_work(root, limit as i64)?;
    for item in items {
        if cancel.load(Ordering::Relaxed) {
            break;
        }
        report.processed += 1;
        let result = process_item(store, &item, &config, &mut report);
        match result {
            Ok(()) => {
                report.ok += 1;
                store.finish_work(&item, true, None, &config)?;
            }
            Err(error) => {
                report.failed += 1;
                store.finish_work(&item, false, Some(&error), &config)?;
            }
        }
    }
    store.refresh_queue_counts(root)?;
    let status = store.status(root)?;
    if let Some(app) = app {
        let _ = app.emit(
            "zendisk://index-progress",
            serde_json::json!({
                "jobId": "work", "root": root, "phase": "work", "report": report,
                "pendingWork": status.as_ref().map(|s| s.pending_work).unwrap_or(0),
            }),
        );
    }
    Ok(report)
}

fn process_item(
    store: &Store,
    item: &WorkItem,
    config: &IndexConfig,
    report: &mut WorkReport,
) -> Result<(), String> {
    let row = store
        .get_file(&item.path)?
        .ok_or_else(|| "index record no longer exists".to_string())?;
    if row.state == "missing" {
        return Ok(());
    }
    if item.kind == "metadata_verify" {
        let metadata = fs::symlink_metadata(&row.path).map_err(|e| format!("verify: {e}"))?;
        let observed = observed_from(&row.root, &row.parent, Path::new(&row.path), &metadata);
        let changed = row.size_bytes != observed.size_bytes
            || row.modified_ns != observed.modified_ns
            || match (&row.identity, &observed.identity) {
                (Some(a), Some(b)) => a != b,
                _ => false,
            };
        if changed {
            store.update_file_metadata(&observed, row.generation)?;
            store.enqueue(&row.root, &row.path, "content_analyze", PRIORITY_MODIFIED)?;
        } else {
            store.touch_file(&row.path, row.generation)?;
        }
        return Ok(());
    }
    // Level 3: content verification, partial fingerprint first.
    let fingerprint = partial_fingerprint(Path::new(&row.path), config.partial_fingerprint_bytes)?;
    if row.fingerprint.as_deref() == Some(fingerprint.as_str())
        && row.analysis_version == ANALYSIS_VERSION
        && row.analysis_status == "analyzed"
    {
        report.fingerprint_reused += 1;
        store.mark_analyzed(
            &row.path,
            &fingerprint,
            &row.content_kind,
            &row.classification,
            row.analysis_version,
        )?;
        return Ok(());
    }
    let (kind, classification) = classify(&row.path, row.size_bytes, config);
    store.mark_analyzed(
        &row.path,
        &fingerprint,
        &kind,
        &classification,
        ANALYSIS_VERSION,
    )?;
    report.reanalysed += 1;
    Ok(())
}

/// Read only a head/tail sample. The length is part of the digest so two files
/// with identical samples but different sizes do not collide.
pub fn partial_fingerprint(path: &Path, sample_bytes: usize) -> Result<String, String> {
    let mut file = fs::File::open(path).map_err(|e| format!("open: {e}"))?;
    let length = file
        .metadata()
        .map(|m| m.len())
        .map_err(|e| format!("stat: {e}"))?;
    let mut buffer = vec![0u8; sample_bytes.max(1)];
    let head = file
        .read(&mut buffer)
        .map_err(|e| format!("read head: {e}"))?;
    let mut hasher = blake3::Hasher::new();
    hasher.update(&length.to_le_bytes());
    hasher.update(&buffer[..head]);
    if length > sample_bytes as u64 * 2 {
        file.seek(SeekFrom::End(-(sample_bytes as i64)))
            .map_err(|e| format!("seek tail: {e}"))?;
        let tail = file
            .read(&mut buffer)
            .map_err(|e| format!("read tail: {e}"))?;
        hasher.update(&buffer[..tail]);
    }
    Ok(hasher.finalize().to_hex().to_string())
}

/// Reconciliation is also a periodic fallback for dropped watcher events.
pub fn reconcile(
    store: &Store,
    root: &str,
    job_id: &str,
    app: Option<&AppHandle>,
) -> Result<ReconcileReport, String> {
    let root_path = safe_path(root).map_err(|e| e.message)?;
    let root_key = root_path.to_string_lossy().into_owned();
    let generation = store
        .root_state(&root_key)?
        .map(|s| s.generation)
        .unwrap_or(0);
    let report = store.reconcile(&root_key, generation)?;
    let (_, pending_work) = store.queue_counts(&root_key)?;
    store
        .conn
        .execute(
            "UPDATE roots SET needs_reconciliation=0, pending_work=?2 WHERE root=?1",
            params![root_key, pending_work],
        )
        .map_err(|e| format!("reconcile state: {e}"))?;
    emit_progress(
        app,
        job_id,
        &root_key,
        generation,
        "reconcile",
        &IndexCounts::default(),
        false,
    );
    Ok(report)
}

/// Watcher / UI / scheduler change hints. Notifications are hints, never truth.
pub fn apply_changes(
    store: &Store,
    root: &str,
    events: &[ChangeEvent],
) -> Result<ChangeReport, String> {
    let root_path = safe_path(root).map_err(|e| e.message)?;
    store.mark_stale_paths(&root_path.to_string_lossy(), events)
}

pub fn index_reset(store: &Store, root: &str) -> Result<bool, String> {
    let root_path = safe_path(root).map_err(|e| e.message)?;
    store.reset_root(&root_path.to_string_lossy())?;
    Ok(true)
}

/// Build the UI payload without touching the filesystem.
pub fn snapshot(store: &Store, root: &str) -> Result<SnapshotData, String> {
    store.build_snapshot(root, 3, 20)
}

/// Verify that a persisted index survives a new connection (restart).
pub fn reopen_check(store: &Store, root: &str) -> Result<Option<IndexStatus>, String> {
    store.status(root)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn observed(path: &str, name: &str, size: u64, modified_ns: i64) -> ObservedEntry {
        ObservedEntry {
            path: path.to_string(),
            parent: "/drive".to_string(),
            name: name.to_string(),
            kind: EntryKind::File,
            size_bytes: size,
            modified_ns,
            created_ns: None,
            identity: Some("dev:ino".to_string()),
        }
    }

    fn row(path: &str, size: u64, modified_ns: i64, status: &str, version: i64) -> FileRow {
        FileRow {
            path: path.to_string(),
            root: "/drive".to_string(),
            parent: "/drive".to_string(),
            name: path.rsplit('/').next().unwrap_or("").to_string(),
            extension: "txt".to_string(),
            content_kind: "text".to_string(),
            size_bytes: size,
            modified_ns,
            created_ns: None,
            identity: Some("dev:ino".to_string()),
            discovered_at: "0".to_string(),
            metadata_verified_at: "0".to_string(),
            content_analyzed_at: None,
            fingerprint: None,
            analysis_status: status.to_string(),
            analysis_version: version,
            classification: "{}".to_string(),
            generation: 1,
            state: "present".to_string(),
        }
    }

    #[test]
    fn level_one_skips_indexed_unchanged_file() {
        let config = IndexConfig::default();
        let ctx = DecisionContext {
            generation: 1,
            config: &config,
            now: 100,
        };
        let known = row("/drive/a.txt", 10, 100, "analyzed", ANALYSIS_VERSION);
        let outcome = decide_entry(
            &observed("/drive/a.txt", "a.txt", 10, 100),
            Some(&known),
            &ctx,
        );
        assert_eq!(outcome.decision, Decision::SkipUnchanged);
    }

    #[test]
    fn metadata_change_forces_analysis() {
        let config = IndexConfig::default();
        let ctx = DecisionContext {
            generation: 1,
            config: &config,
            now: 100,
        };
        let known = row("/drive/a.txt", 10, 100, "analyzed", ANALYSIS_VERSION);
        let outcome = decide_entry(
            &observed("/drive/a.txt", "a.txt", 11, 100),
            Some(&known),
            &ctx,
        );
        assert_eq!(outcome.decision, Decision::Analyze);
        assert_eq!(outcome.rule, "metadata");
    }

    #[test]
    fn timestamp_change_alone_does_not_force_full_hash() {
        let config = IndexConfig::default();
        let ctx = DecisionContext {
            generation: 1,
            config: &config,
            now: 100,
        };
        let known = row("/drive/a.txt", 10, 100, "analyzed", ANALYSIS_VERSION);
        let outcome = decide_entry(
            &observed("/drive/a.txt", "a.txt", 10, 200),
            Some(&known),
            &ctx,
        );
        assert_ne!(outcome.decision, Decision::Ignore);
    }

    #[test]
    fn outdated_analysis_version_is_reanalysed() {
        let config = IndexConfig::default();
        let ctx = DecisionContext {
            generation: 1,
            config: &config,
            now: 100,
        };
        let known = row("/drive/a.txt", 10, 100, "analyzed", ANALYSIS_VERSION - 1);
        let outcome = decide_entry(
            &observed("/drive/a.txt", "a.txt", 10, 100),
            Some(&known),
            &ctx,
        );
        assert_eq!(outcome.decision, Decision::Analyze);
        assert_eq!(outcome.rule, "version");
    }

    #[test]
    fn unreliable_timestamp_uses_fingerprint_path() {
        let config = IndexConfig::default();
        let ctx = DecisionContext {
            generation: 1,
            config: &config,
            now: 100,
        };
        let mut known = row("/drive/a.txt", 10, 0, "analyzed", ANALYSIS_VERSION);
        known.fingerprint = None;
        let outcome = decide_entry(
            &observed("/drive/a.txt", "a.txt", 10, 0),
            Some(&known),
            &ctx,
        );
        assert_eq!(outcome.rule, "unreliable-time");
    }

    #[test]
    fn failures_retry_with_backoff_and_terminal_state() {
        let store = Store::in_memory().unwrap();
        let config = store.config().unwrap();
        store.ensure_root("/drive").unwrap();
        store
            .enqueue("/drive", "/drive/a.txt", "content_analyze", 80)
            .unwrap();
        let item = store.claim_work("/drive", 1).unwrap().remove(0);
        for _ in 0..config.max_retry_attempts {
            store
                .finish_work(&item, false, Some("io error"), &config)
                .unwrap();
            store
                .conn
                .execute(
                    "UPDATE work_queue SET state='pending' WHERE id=?1",
                    params![item.id],
                )
                .unwrap();
        }
        let failed: i64 = store
            .conn
            .query_row(
                "SELECT COUNT(*) FROM work_queue WHERE state='failed'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(failed, 1);
    }

    #[test]
    fn work_queue_deduplicates_requests() {
        let store = Store::in_memory().unwrap();
        store.ensure_root("/drive").unwrap();
        store
            .enqueue("/drive", "/drive/a.txt", "content_analyze", 10)
            .unwrap();
        store
            .enqueue("/drive", "/drive/a.txt", "content_analyze", 90)
            .unwrap();
        let count: i64 = store
            .conn
            .query_row("SELECT COUNT(*) FROM work_queue", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1);
        let priority: i32 = store
            .conn
            .query_row("SELECT priority FROM work_queue", [], |r| r.get(0))
            .unwrap();
        assert_eq!(priority, 90);
    }

    #[test]
    fn running_work_is_recovered_after_crash() {
        let store = Store::in_memory().unwrap();
        store.ensure_root("/drive").unwrap();
        store
            .enqueue("/drive", "/drive/a.txt", "content_analyze", 10)
            .unwrap();
        let items = store.claim_work("/drive", 1).unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(store.claim_work("/drive", 1).unwrap().len(), 0);
        store.recover_work().unwrap();
        assert_eq!(store.claim_work("/drive", 1).unwrap().len(), 1);
    }

    #[test]
    fn exclusions_and_links_are_ignored_with_a_reason() {
        let config = IndexConfig::default();
        let ctx = DecisionContext {
            generation: 1,
            config: &config,
            now: 100,
        };
        let mut entry = observed("C:\\WindowsApps\\app.exe", "app.exe", 10, 100);
        assert_eq!(decide_entry(&entry, None, &ctx).decision, Decision::Ignore);
        entry.kind = EntryKind::Link;
        let outcome = decide_entry(&entry, None, &ctx);
        assert_eq!(outcome.decision, Decision::Ignore);
        assert_eq!(outcome.rule, "reparse");
    }

    #[test]
    fn large_files_are_deferred_not_ignored() {
        let config = IndexConfig::default();
        let entry = observed("/drive/big.iso", "big.iso", 20 * 1024 * 1024 * 1024, 100);
        assert_eq!(priority_for(&entry, None, &config), PRIORITY_BACKGROUND);
        let (kind, classification) = classify(&entry.path, entry.size_bytes, &config);
        assert_eq!(kind, "disk-image");
        assert!(classification.contains("sample-only"));
    }

    #[test]
    fn change_hints_mark_stale_and_queue_verification() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().to_string_lossy().into_owned();
        let path = dir.path().join("a.txt").to_string_lossy().into_owned();
        let store = Store::in_memory().unwrap();
        store.ensure_root(&root).unwrap();
        store
            .upsert_files(
                &root,
                1,
                &[row(&path, 10, 100, "analyzed", ANALYSIS_VERSION)],
            )
            .unwrap();
        let events = vec![ChangeEvent {
            path: path.clone(),
            kind: "modified".to_string(),
            old_path: None,
            at: "0".to_string(),
        }];
        let report = apply_changes(&store, &root, &events).unwrap();
        assert_eq!(report.accepted, 1);
        let file = store.get_file(&path).unwrap().unwrap();
        assert_eq!(file.analysis_status, "stale");
        assert_eq!(store.queue_counts(&root).unwrap().1, 1);
    }

    #[test]
    fn snapshot_and_index_survive_new_connection() {
        let dir = tempfile::tempdir().unwrap();
        let db = dir.path().join("index.sqlite");
        let root = dir.path().to_string_lossy().into_owned();
        {
            let store = Store::open(&db).unwrap();
            store.ensure_root(&root).unwrap();
            store
                .upsert_files(
                    &root,
                    1,
                    &[row(
                        &format!("{root}/a.txt"),
                        10,
                        100,
                        "analyzed",
                        ANALYSIS_VERSION,
                    )],
                )
                .unwrap();
            store.finish_generation(&root, 1, "complete").unwrap();
        }
        let reopened = Store::open(&db).unwrap();
        let status = reopened.status(&root).unwrap().unwrap();
        assert_eq!(status.generation, 1);
        assert!(status.fresh);
        let snapshot = reopened.build_snapshot(&root, 3, 20).unwrap();
        assert_eq!(snapshot.scanned_items, 1);
    }

    fn tree(root: &Path) {
        fs::create_dir_all(root.join("docs/nested")).unwrap();
        fs::create_dir_all(root.join("media")).unwrap();
        for index in 0..12 {
            fs::write(root.join(format!("docs/file-{index}.txt")).as_path(), vec![b'a'; 1_024]).unwrap();
        }
        fs::write(root.join("docs/nested/deep.txt"), vec![b'b'; 2_048]).unwrap();
        fs::write(root.join("media/clip.mp4"), vec![b'c'; 4_096]).unwrap();
    }

    #[test]
    fn second_scan_with_no_changes_does_no_discovery_work() {
        let dir = tempfile::tempdir().unwrap();
        tree(dir.path());
        let root = dir.path().to_string_lossy().into_owned();
        let store = Store::open(&dir.path().join("i.sqlite")).unwrap();
        let cancel = AtomicBool::new(false);
        let paused = AtomicBool::new(false);
        let cold = discover(&store, &root, "cold", false, &cancel, &paused, None).unwrap();
        assert!(!cold.fresh);
        assert!(cold.counts.discovered > 0);
        let warm = discover(&store, &root, "warm", false, &cancel, &paused, None).unwrap();
        assert!(warm.fresh, "a second unchanged pass must be a cache hit");
        assert_eq!(warm.counts.discovered, 0, "warm pass must not touch the filesystem");
        assert_eq!(warm.counts.analyze_scheduled, 0);
        assert!(store.status(&root).unwrap().unwrap().fresh);
    }

    #[test]
    fn only_modified_file_is_reanalysed_on_rescan() {
        let dir = tempfile::tempdir().unwrap();
        tree(dir.path());
        let root = dir.path().to_string_lossy().into_owned();
        let store = Store::open(&dir.path().join("i.sqlite")).unwrap();
        let cancel = AtomicBool::new(false);
        let paused = AtomicBool::new(false);
        discover(&store, &root, "cold", false, &cancel, &paused, None).unwrap();
        process_work(&store, &root, 1_000, &cancel, None).unwrap();

        let changed = dir.path().join("docs/file-3.txt");
        fs::write(&changed, vec![b'z'; 2_048]).unwrap();
        let rescan = discover(&store, &root, "force", true, &cancel, &paused, None).unwrap();
        assert_eq!(rescan.counts.analyze_scheduled, 1, "only the changed file needs analysis");
        assert!(rescan.counts.unchanged >= 10, "unchanged files must be skipped");
        let analyzed: i64 = store
            .conn
            .query_row(
                "SELECT COUNT(*) FROM files WHERE analysis_status='analyzed'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(analyzed, 14);
    }

    #[test]
    fn index_survives_restart_without_losing_progress() {
        let dir = tempfile::tempdir().unwrap();
        tree(dir.path());
        let db = dir.path().join("i.sqlite");
        let root = dir.path().to_string_lossy().into_owned();
        let cancel = AtomicBool::new(false);
        let paused = AtomicBool::new(false);
        {
            let store = Store::open(&db).unwrap();
            discover(&store, &root, "before", false, &cancel, &paused, None).unwrap();
        }
        let reopened = Store::open(&db).unwrap();
        let warm = discover(&reopened, &root, "after", false, &cancel, &paused, None).unwrap();
        assert!(warm.fresh);
        assert_eq!(reopened.stats(&root).unwrap().total_files, 14);
    }

    /// Ignored by default. Run with `cargo test -- --ignored --nocapture` on CI
    /// to record cold vs warm instrumentation for a generated tree.
    #[test]
    #[ignore]
    fn benchmark_cold_vs_warm() {
        let dir = tempfile::tempdir().unwrap();
        for outer in 0..40 {
            let branch = dir.path().join(format!("branch-{outer}"));
            fs::create_dir_all(&branch).unwrap();
            for index in 0..250 {
                fs::write(branch.join(format!("file-{index}.bin")), vec![b'x'; 512]).unwrap();
            }
        }
        let root = dir.path().to_string_lossy().into_owned();
        let store = Store::open(&dir.path().join("bench.sqlite")).unwrap();
        let cancel = AtomicBool::new(false);
        let paused = AtomicBool::new(false);
        let cold_at = Instant::now();
        let cold = discover(&store, &root, "bench-cold", false, &cancel, &paused, None).unwrap();
        let cold_time = cold_at.elapsed();
        let warm_at = Instant::now();
        let warm = discover(&store, &root, "bench-warm", false, &cancel, &paused, None).unwrap();
        let warm_time = warm_at.elapsed();
        println!(
            "cold: {} items in {:?}; warm: {} items in {:?}; metadata ops avoided: {}",
            cold.counts.discovered, cold_time, warm.counts.discovered, warm_time,
            cold.counts.discovered - warm.counts.discovered,
        );
        assert!(warm.fresh);
        assert_eq!(warm.counts.discovered, 0);
    }
}
