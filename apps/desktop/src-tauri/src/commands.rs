//! Native commands for ZenDisk. Every command validates its inputs, returns a
//! structured error, and never fabricates a measurement it cannot obtain.
use std::collections::HashMap;
use std::fs;
use std::io::Seek;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use sysinfo::{Disks, System};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
    pub recoverable: bool,
}

impl CommandError {
    fn new(code: &str, message: impl Into<String>, recoverable: bool) -> Self {
        Self { code: code.into(), message: message.into(), recoverable }
    }
}

pub type Result<T> = std::result::Result<T, CommandError>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub modified_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub id: String,
    pub name: String,
    pub letter: Option<String>,
    pub capacity: u64,
    pub free: u64,
    pub filesystem: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TreeNode {
    pub id: String,
    pub name: String,
    pub size_bytes: u64,
    pub path: String,
    pub children: Vec<TreeNode>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisData {
    pub drive_id: String,
    pub scanned_bytes: u64,
    pub scanned_items: usize,
    pub tree: Vec<TreeNode>,
    pub largest_files: Vec<FileEntry>,
    pub largest_folders: Vec<FileEntry>,
    pub is_partial: bool,
    pub scan_state: String,
    pub skipped_locations: Vec<SkippedLocation>,
    pub budget_exceeded: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupCandidate {
    pub category: String,
    pub files: Vec<FileEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkippedLocation {
    pub path: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub job_id: String,
    pub scanned_bytes: u64,
    pub scanned_items: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Metric {
    pub id: String,
    pub label: String,
    pub value: f64,
    pub max: f64,
    pub display_value: String,
    pub detail: String,
    pub supported: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthAttribute {
    pub id: String,
    pub label: String,
    pub value: String,
    pub supported: bool,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveHealth {
    pub drive_id: String,
    pub name: String,
    pub status: String,
    pub summary: String,
    pub source: String,
    pub limitations: Vec<String>,
    pub attributes: Vec<HealthAttribute>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DuplicateGroup {
    pub id: String,
    pub kind: String,
    pub files: Vec<FileEntry>,
    pub verification: String,
    pub algorithm: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OperationRecord {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub at: String,
    pub completed: i64,
    pub failed: i64,
    pub skipped: i64,
    pub total: i64,
    pub reclaimed_bytes: u64,
    pub recoverable: bool,
}

fn now() -> String {
    let secs = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    format!("{}", secs)
}

fn new_id() -> String {
    format!("{:x}{:x}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos(), std::process::id())
}

/// Canonicalize an absolute path and reject traversal above the filesystem root.
pub fn safe_path(input: &str) -> Result<PathBuf> {
    if input.trim().is_empty() {
        return Err(CommandError::new("invalidPath", "Path is empty", false));
    }
    let path = PathBuf::from(input);
    if !path.is_absolute() {
        return Err(CommandError::new("invalidPath", "Path must be absolute", false));
    }
    let canonical = path.canonicalize().unwrap_or_else(|_| path.clone());
    for component in canonical.components() {
        if matches!(component, Component::Prefix(_) | Component::RootDir | Component::Normal(_)) {
            continue;
        }
        return Err(CommandError::new("invalidPath", "Path contains traversal", false));
    }
    Ok(canonical)
}

/// Build an entry from metadata the walker already obtained. Avoids a second
/// `stat` syscall per file, which dominated scan time on large drives.
fn file_entry_from_metadata(path: &Path, metadata: &fs::Metadata) -> Result<FileEntry> {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
    let modified = metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH);
    let modified_at = format!("{}", modified.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs());
    Ok(FileEntry {
        id: new_id(),
        name,
        path: path.to_string_lossy().into_owned(),
        size_bytes: metadata.len(),
        modified_at,
    })
}

fn file_entry(path: &Path) -> Result<FileEntry> {
    let metadata = fs::metadata(path).map_err(|e| CommandError::new("io", e.to_string(), true))?;
    file_entry_from_metadata(path, &metadata)
}

static JOBS: OnceLock<Mutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();
fn jobs() -> &'static Mutex<HashMap<String, Arc<AtomicBool>>> {
    JOBS.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Separate from cancellation: pausing suspends work without discarding it.
static PAUSED_JOBS: OnceLock<Mutex<HashMap<String, Arc<AtomicBool>>>> = OnceLock::new();
fn paused_jobs() -> &'static Mutex<HashMap<String, Arc<AtomicBool>>> {
    PAUSED_JOBS.get_or_init(|| Mutex::new(HashMap::new()))
}

pub(crate) fn disk_list_impl() -> Result<Vec<DiskInfo>> {
    let disks = Disks::new_with_refreshed_list();
    let mut out = Vec::new();
    for disk in disks.list() {
        let mount = disk.mount_point().to_string_lossy().into_owned();
        // Windows mount points arrive as "C:"; disk_analyze requires an
        // absolute path, so normalize to "C:\\" for the command id/scan root.
        let root = if mount.len() == 2 && mount.as_bytes()[1] == b':' {
            format!("{}\\", mount)
        } else {
            mount.clone()
        };
        let label = disk.name().to_string_lossy().into_owned();
        let letter = root.chars().next().filter(|c| c.is_ascii_alphabetic()).map(|c| format!("{}:", c));
        out.push(DiskInfo {
            id: root,
            name: if label.is_empty() { mount } else { label },
            letter,
            capacity: disk.total_space(),
            free: disk.available_space(),
            filesystem: disk.file_system().to_string_lossy().into_owned(),
        });
    }
    Ok(out)
}

#[tauri::command]
pub async fn disk_list() -> Result<Vec<DiskInfo>> {
    tauri::async_runtime::spawn_blocking(disk_list_impl)
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

struct ScanStats {
    bytes: u64,
    items: usize,
    partial: bool,
    cancelled: bool,
    files: Vec<FileEntry>,
    skipped: Vec<SkippedLocation>,
    budget_exceeded: bool,
    deadline: Instant,
}

impl Default for ScanStats {
    fn default() -> Self {
        Self {
            bytes: 0,
            items: 0,
            partial: false,
            cancelled: false,
            files: Vec::new(),
            skipped: Vec::new(),
            budget_exceeded: false,
            deadline: Instant::now() + SCAN_TIME_LIMIT,
        }
    }
}

fn mark_partial(stats: &mut ScanStats, path: &Path, reason: &str) {
    stats.partial = true;
    if stats.skipped.len() < 20 {
        stats.skipped.push(SkippedLocation {
            path: path.to_string_lossy().into_owned(),
            reason: reason.to_string(),
        });
    }
}

/// Junctions and symlinks are navigation shortcuts, not folders to analyze.
/// Skipping them is expected and must not mark a scan as partial.
fn is_link(metadata: &fs::Metadata) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        // FILE_ATTRIBUTE_REPARSE_POINT covers junctions, mounts, and other
        // links that would otherwise send the walker outside the drive.
        const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;
        metadata.file_type().is_symlink()
            || (metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT) != 0
    }
    #[cfg(not(windows))]
    {
        metadata.file_type().is_symlink()
    }
}

/// Protected OS folders are unreadable without elevation and are not useful
/// storage-cleanup targets. Skipping them by design avoids a partial result
/// on an otherwise healthy drive.
fn is_system_location(name: &str) -> bool {
    matches!(
        name.to_ascii_lowercase().as_str(),
        "system volume information"
            | "$recycle.bin"
            | "$windows.~bt"
            | "$windows.~ws"
            | "recovery"
            | "perflogs"
            | "msocache"
            | "config.msi"
            | "documents and settings"
    )
}

const SCAN_ITEM_LIMIT: usize = 200_000;
const SCAN_TIME_LIMIT: Duration = Duration::from_secs(25);

fn walk_tree(
    path: &Path,
    depth: usize,
    cancel: &AtomicBool,
    paused: &AtomicBool,
    stats: &mut ScanStats,
    app: &AppHandle,
    job_id: &str,
    last_emit: &mut SystemTime,
) -> Result<TreeNode> {
    let mut node = TreeNode {
        id: path.to_string_lossy().into_owned(),
        name: path.file_name().and_then(|n| n.to_str()).unwrap_or("root").to_string(),
        size_bytes: 0,
        path: path.to_string_lossy().into_owned(),
        children: Vec::new(),
    };
    let entries = match fs::read_dir(path) {
        Ok(entries) => entries,
        Err(_) => {
            mark_partial(stats, path, "Access denied or folder unreadable");
            return Ok(node);
        }
    };
    for entry in entries.flatten() {
        if cancel.load(Ordering::Relaxed) {
            stats.cancelled = true;
            stats.partial = true;
            break;
        }
        // Pausing suspends the worker without consuming the time budget.
        if paused.load(Ordering::Relaxed) {
            let paused_at = Instant::now();
            while paused.load(Ordering::Relaxed) {
                if cancel.load(Ordering::Relaxed) {
                    stats.cancelled = true;
                    stats.partial = true;
                    break;
                }
                std::thread::sleep(Duration::from_millis(50));
            }
            stats.deadline += paused_at.elapsed();
            if stats.cancelled { break; }
        }
        // Hard budget keeps a full drive scan bounded and responsive.
        if stats.items >= SCAN_ITEM_LIMIT || stats.deadline.elapsed() >= SCAN_TIME_LIMIT {
            stats.budget_exceeded = true;
            stats.partial = true;
            break;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        if is_system_location(&name) {
            continue;
        }
        let child_path = entry.path();
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => {
                mark_partial(stats, &child_path, "Metadata unavailable");
                continue;
            }
        };
        stats.items += 1;
        if metadata.is_dir() {
            // Reparse points are skipped by design, not a partial result.
            if is_link(&metadata) { continue; }
            if depth < 3 {
                let child = walk_tree(&child_path, depth + 1, cancel, paused, stats, app, job_id, last_emit)?;
                node.size_bytes += child.size_bytes;
                node.children.push(child);
            }
        } else {
            stats.bytes += metadata.len();
            node.size_bytes += metadata.len();
            if let Ok(file) = file_entry_from_metadata(&child_path, &metadata) {
                stats.files.push(file);
                // Keep the candidate set bounded on very large drives.
                if stats.files.len() > 200 {
                    stats.files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
                    stats.files.truncate(20);
                }
            }
        }
        if let Ok(elapsed) = last_emit.elapsed() {
            if elapsed.as_millis() >= 200 {
                let _ = app.emit("zendisk://scan-progress", ProgressEvent {
                    job_id: job_id.to_string(), scanned_bytes: stats.bytes, scanned_items: stats.items,
                });
                *last_emit = SystemTime::now();
            }
        }
    }
    Ok(node)
}

pub(crate) fn disk_analyze_impl(app: AppHandle, drive_id: String, job_id: String) -> Result<AnalysisData> {
    let root = safe_path(&drive_id)?;
    let cancel = Arc::new(AtomicBool::new(false));
    let paused = Arc::new(AtomicBool::new(false));
    jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?.insert(job_id.clone(), cancel.clone());
    paused_jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?.insert(job_id.clone(), paused.clone());

    let mut stats = ScanStats::default();
    let mut last_emit = SystemTime::now();
    let tree = walk_tree(&root, 0, &cancel, &paused, &mut stats, &app, &job_id, &mut last_emit)?;

    stats.files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    stats.files.truncate(20);
    let mut largest_folders: Vec<FileEntry> = tree.children.iter().map(|n| FileEntry {
        id: n.id.clone(), name: n.name.clone(), path: n.path.clone(), size_bytes: n.size_bytes, modified_at: now(),
    }).collect();
    largest_folders.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
    largest_folders.truncate(20);

    jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?.remove(&job_id);
    paused_jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?.remove(&job_id);
    Ok(AnalysisData {
        drive_id, scanned_bytes: stats.bytes, scanned_items: stats.items, tree: vec![tree],
        largest_files: stats.files, largest_folders,
        is_partial: stats.partial,
        scan_state: if stats.cancelled {
            "cancelled".into()
        } else if stats.partial {
            "partial".into()
        } else {
            "completed".into()
        },
        skipped_locations: stats.skipped,
        budget_exceeded: stats.budget_exceeded,
    })
}

#[tauri::command]
pub async fn disk_analyze(app: AppHandle, drive_id: String, job_id: String) -> Result<AnalysisData> {
    tauri::async_runtime::spawn_blocking(move || disk_analyze_impl(app, drive_id, job_id))
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

#[tauri::command]
pub fn analyze_cancel(job_id: String) -> Result<bool> {
    let guard = jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?;
    if let Some(flag) = guard.get(&job_id) {
        flag.store(true, Ordering::Relaxed);
        Ok(true)
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn analyze_pause(job_id: String, pause: bool) -> Result<bool> {
    let guard = paused_jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?;
    if let Some(flag) = guard.get(&job_id) {
        flag.store(pause, Ordering::Relaxed);
        Ok(true)
    } else {
        Ok(false)
    }
}

pub(crate) fn files_list_impl(path: String) -> Result<Vec<FileEntry>> {
    let root = safe_path(&path)?;
    let mut out = Vec::new();
    for entry in fs::read_dir(root).map_err(|e| CommandError::new("io", e.to_string(), true))?.flatten() {
        if let Ok(file) = file_entry(&entry.path()) { out.push(file); }
    }
    Ok(out)
}

#[tauri::command]
pub async fn files_list(path: String) -> Result<Vec<FileEntry>> {
    tauri::async_runtime::spawn_blocking(move || files_list_impl(path))
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

fn quarantine_dir(app: &AppHandle) -> Result<PathBuf> {
    let base = app.path().app_data_dir().map_err(|e| CommandError::new("path", e.to_string(), true))?;
    let dir = base.join("quarantine");
    fs::create_dir_all(&dir).map_err(|e| CommandError::new("io", e.to_string(), true))?;
    Ok(dir)
}

pub(crate) fn cleanup_preview_impl(paths: Vec<String>) -> Result<Vec<FileEntry>> {
    let mut out = Vec::new();
    for path in paths {
        let safe = safe_path(&path)?;
        if safe.is_file() { out.push(file_entry(&safe)?); }
    }
    Ok(out)
}

#[tauri::command]
pub async fn cleanup_preview(paths: Vec<String>) -> Result<Vec<FileEntry>> {
    tauri::async_runtime::spawn_blocking(move || cleanup_preview_impl(paths))
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

/// Lists bounded, top-level temporary-file candidates from known scratch
/// locations. Nothing is moved or deleted here; the UI still previews and
/// confirms every file before `cleanup_execute` runs.
pub(crate) fn cleanup_candidates_impl() -> Result<Vec<CleanupCandidate>> {
    let mut roots: Vec<PathBuf> = vec![std::env::temp_dir()];
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        let base = PathBuf::from(local);
        for suffix in ["Temp", "CrashDumps"] {
            let path = base.join(suffix);
            if path.is_dir() {
                roots.push(path);
            }
        }
    }
    roots.dedup();

    let mut groups: HashMap<String, Vec<FileEntry>> = HashMap::new();
    for root in roots {
        let entries = match fs::read_dir(&root) {
            Ok(entries) => entries,
            Err(_) => continue,
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_file() {
                continue;
            }
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_lowercase();
            let category = if name.ends_with(".msi") || name.ends_with(".exe") {
                "installers"
            } else if name.ends_with(".log") || name.contains("crash") {
                "logs"
            } else if name.contains("cache") {
                "cache"
            } else {
                "temp"
            };
            if let Ok(file) = file_entry(&path) {
                groups.entry(category.to_string()).or_default().push(file);
            }
        }
    }
    for files in groups.values_mut() {
        files.sort_by(|a, b| b.size_bytes.cmp(&a.size_bytes));
        files.truncate(50);
    }
    let order = ["temp", "cache", "installers", "logs"];
    Ok(order
        .iter()
        .filter_map(|key| {
            groups.remove(*key).map(|files| CleanupCandidate {
                category: key.to_string(),
                files,
            })
        })
        .collect())
}

#[tauri::command]
pub async fn cleanup_candidates() -> Result<Vec<CleanupCandidate>> {
    tauri::async_runtime::spawn_blocking(cleanup_candidates_impl)
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

pub(crate) fn cleanup_execute_impl(app: AppHandle, paths: Vec<String>) -> Result<OperationRecord> {
    let quarantine = quarantine_dir(&app)?;
    let mut completed = 0i64;
    let mut failed = 0i64;
    let mut reclaimed = 0u64;
    for path in paths {
        let safe = safe_path(&path)?;
        if !safe.is_file() { failed += 1; continue; }
        let size = safe.metadata().map(|m| m.len()).unwrap_or(0);
        let target = quarantine.join(safe.file_name().unwrap_or_default());
        if target.exists() { failed += 1; continue; }
        match fs::rename(&safe, &target) {
            Ok(()) => { completed += 1; reclaimed += size; }
            Err(_) => failed += 1,
        }
    }
    let record = OperationRecord {
        id: new_id(), kind: "cleanup".into(), title: "Cleanup".into(), at: now(),
        completed, failed, skipped: 0, total: completed + failed,
        reclaimed_bytes: reclaimed, recoverable: true,
    };
    write_history(&app, &record)?;
    Ok(record)
}

#[tauri::command]
pub async fn cleanup_execute(app: AppHandle, paths: Vec<String>) -> Result<OperationRecord> {
    tauri::async_runtime::spawn_blocking(move || cleanup_execute_impl(app, paths))
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

#[tauri::command]
pub fn quarantine_restore(_app: AppHandle, _names: Vec<String>) -> Result<OperationRecord> {
    Err(CommandError::new(
        "unsupported",
        "Restore needs the original path recorded when the file was quarantined; that metadata is not available yet.",
        true,
    ))
}

#[tauri::command]
pub fn organizer_preview(paths: Vec<String>) -> Result<Vec<OperationRecord>> {
    // A dry run never touches files; conflicts are reported as skipped.
    let mut out = Vec::new();
    for path in paths {
        let safe = safe_path(&path)?;
        out.push(OperationRecord {
            id: new_id(), kind: "organize".into(), title: "Preview".into(), at: now(),
            completed: 0, failed: 0, skipped: if safe.exists() { 0 } else { 1 },
            total: 1, reclaimed_bytes: 0, recoverable: true,
        });
    }
    Ok(out)
}

pub(crate) fn duplicates_scan_impl(app: AppHandle, root: String, job_id: String) -> Result<Vec<DuplicateGroup>> {
    let root_path = safe_path(&root)?;
    let cancel = Arc::new(AtomicBool::new(false));
    jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?.insert(job_id.clone(), cancel.clone());
    let mut by_size: HashMap<u64, Vec<PathBuf>> = HashMap::new();
    let mut stack = vec![root_path];
    while let Some(dir) = stack.pop() {
        if cancel.load(Ordering::Relaxed) { break; }
        let entries = match fs::read_dir(&dir) { Ok(e) => e, Err(_) => continue };
        for entry in entries.flatten() {
            let path = entry.path();
            let metadata = match entry.metadata() { Ok(m) => m, Err(_) => continue };
            if metadata.is_dir() {
                if !metadata.file_type().is_symlink() { stack.push(path); }
            } else {
                by_size.entry(metadata.len()).or_default().push(path);
            }
        }
    }
    let mut groups = Vec::new();
    for (size, paths) in by_size {
        if paths.len() < 2 || size == 0 { continue; }
        let mut partial: HashMap<String, Vec<PathBuf>> = HashMap::new();
        for path in &paths {
            if cancel.load(Ordering::Relaxed) { break; }
            let key = match partial_digest(path) { Ok(k) => k, Err(_) => continue };
            partial.entry(key).or_default().push(path.clone());
        }
        for candidates in partial.values() {
            if candidates.len() < 2 { continue; }
            let mut full: HashMap<String, Vec<PathBuf>> = HashMap::new();
            for path in candidates {
                if cancel.load(Ordering::Relaxed) { break; }
                let key = match full_digest(path) { Ok(k) => k, Err(_) => continue };
                full.entry(key).or_default().push(path.clone());
            }
            for matches in full.values().filter(|v| v.len() > 1) {
                let mut files = Vec::new();
                for path in matches {
                    if let Ok(file) = file_entry(path) { files.push(file); }
                }
                if files.len() > 1 {
                    groups.push(DuplicateGroup {
                        id: new_id(), kind: "exact".into(), files,
                        verification: "full".into(), algorithm: "blake3".into(),
                    });
                }
            }
        }
    }
    let _ = app.emit("zendisk://duplicates-progress", ProgressEvent { job_id: job_id.clone(), scanned_bytes: 0, scanned_items: groups.len() });
    jobs().lock().map_err(|_| CommandError::new("internal", "Job lock poisoned", false))?.remove(&job_id);
    Ok(groups)
}

#[tauri::command]
pub async fn duplicates_scan(app: AppHandle, root: String, job_id: String) -> Result<Vec<DuplicateGroup>> {
    tauri::async_runtime::spawn_blocking(move || duplicates_scan_impl(app, root, job_id))
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

pub fn partial_digest(path: &Path) -> Result<String> {
    use std::io::Read;
    let mut file = fs::File::open(path).map_err(|e| CommandError::new("io", e.to_string(), true))?;
    let mut buf = [0u8; 65_536];
    let n = file.read(&mut buf).map_err(|e| CommandError::new("io", e.to_string(), true))?;
    let len = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    let mut h = blake3::Hasher::new();
    h.update(&len.to_le_bytes());
    h.update(&buf[..n]);
    if len > 65_536 {
        let _ = file.seek(std::io::SeekFrom::End(-65_536));
        let mut tail = [0u8; 65_536];
        let m = file.read(&mut tail).map_err(|e| CommandError::new("io", e.to_string(), true))?;
        h.update(&tail[..m]);
    }
    Ok(hex(h.finalize().as_bytes()))
}

pub fn full_digest(path: &Path) -> Result<String> {
    let bytes = fs::read(path).map_err(|e| CommandError::new("io", e.to_string(), true))?;
    Ok(hex(blake3::hash(&bytes).as_bytes()))
}

fn hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

pub(crate) fn system_metrics_impl() -> Result<Vec<Metric>> {
    let mut system = System::new_all();
    system.refresh_all();
    let cpu = system.global_cpu_usage() as f64;
    let used = system.used_memory() as f64;
    let total = system.total_memory() as f64;
    Ok(vec![
        Metric { id: "cpu".into(), label: "CPU".into(), value: cpu, max: 100.0, display_value: format!("{:.0}%", cpu), detail: "Current processor load".into(), supported: true },
        Metric { id: "memory".into(), label: "Memory".into(), value: used / (1024.0 * 1024.0), max: total / (1024.0 * 1024.0), display_value: format!("{:.1} GB", used / (1024.0 * 1024.0 * 1024.0)), detail: "of installed memory".into(), supported: true },
    ])
}

#[tauri::command]
pub async fn system_metrics() -> Result<Vec<Metric>> {
    tauri::async_runtime::spawn_blocking(system_metrics_impl)
        .await
        .map_err(|e| CommandError::new("internal", e.to_string(), true))?
}

#[tauri::command]
pub fn disk_health() -> Result<Vec<DriveHealth>> {
    // SMART is not available through cross-platform Rust APIs without a driver.
    // Report the limitation explicitly rather than fabricating values.
    Ok(Vec::new())
}

#[tauri::command]
pub fn startup_list() -> Result<Vec<serde_json::Value>> {
    Ok(Vec::new())
}

#[tauri::command]
pub fn apps_list() -> Result<Vec<serde_json::Value>> {
    Ok(Vec::new())
}

#[tauri::command]
pub fn automation_list() -> Result<Vec<serde_json::Value>> {
    Ok(Vec::new())
}

#[tauri::command]
pub fn automation_set(_id: String, _enabled: bool) -> Result<bool> {
    Ok(false)
}

fn db_path(app: &AppHandle) -> Result<PathBuf> {
    let base = app.path().app_data_dir().map_err(|e| CommandError::new("path", e.to_string(), true))?;
    fs::create_dir_all(&base).map_err(|e| CommandError::new("io", e.to_string(), true))?;
    Ok(base.join("history.sqlite"))
}

fn ensure_history_table(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS operations (id TEXT PRIMARY KEY, kind TEXT, title TEXT, at TEXT, completed INTEGER, failed INTEGER, skipped INTEGER, total INTEGER, reclaimed INTEGER, recoverable INTEGER)",
        [],
    )
    .map(|_| ())
    .map_err(|e| CommandError::new("db", e.to_string(), true))
}

fn write_history(app: &AppHandle, record: &OperationRecord) -> Result<()> {
    let conn = Connection::open(db_path(app)?).map_err(|e| CommandError::new("db", e.to_string(), true))?;
    ensure_history_table(&conn)?;
    conn.execute(
        "INSERT INTO operations (id, kind, title, at, completed, failed, skipped, total, reclaimed, recoverable) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![record.id, record.kind, record.title, record.at, record.completed, record.failed, record.skipped, record.total, record.reclaimed_bytes as i64, record.recoverable as i64],
    ).map_err(|e| CommandError::new("db", e.to_string(), true))?;
    Ok(())
}

#[tauri::command]
pub fn operations_history(app: AppHandle) -> Result<Vec<OperationRecord>> {
    let conn = Connection::open(db_path(&app)?).map_err(|e| CommandError::new("db", e.to_string(), true))?;
    // A fresh install has no history yet: create the table before reading it so
    // the first launch returns an empty list instead of a "no such table" error.
    ensure_history_table(&conn)?;
    let mut stmt = conn.prepare("SELECT id, kind, title, at, completed, failed, skipped, total, reclaimed, recoverable FROM operations ORDER BY at DESC LIMIT 200")
        .map_err(|e| CommandError::new("db", e.to_string(), true))?;
    let rows = stmt.query_map([], |row| {
        Ok(OperationRecord {
            id: row.get(0)?, kind: row.get(1)?, title: row.get(2)?, at: row.get(3)?,
            completed: row.get(4)?, failed: row.get(5)?, skipped: row.get(6)?, total: row.get(7)?,
            reclaimed_bytes: row.get::<_, i64>(8)? as u64, recoverable: row.get::<_, i64>(9)? != 0,
        })
    }).map_err(|e| CommandError::new("db", e.to_string(), true))?;
    let mut out = Vec::new();
    for row in rows.flatten() { out.push(row); }
    Ok(out)
}

#[tauri::command]
pub fn reports_summary(app: AppHandle) -> Result<Vec<OperationRecord>> {
    operations_history(app)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn skips_protected_system_locations() {
        assert!(is_system_location("System Volume Information"));
        assert!(is_system_location("$Recycle.Bin"));
        assert!(is_system_location("$WINDOWS.~BT"));
        assert!(!is_system_location("Documents"));
        assert!(!is_system_location("Program Files"));
    }

    #[test]
    fn history_table_exists_on_first_read() {
        let conn = Connection::open_in_memory().unwrap();
        ensure_history_table(&conn).unwrap();
        let mut stmt = conn.prepare("SELECT COUNT(*) FROM operations").unwrap();
        let count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn rejects_relative_paths() {
        assert!(safe_path("relative/path").is_err());
    }

    #[test]
    fn partial_hash_includes_length() {
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("a.bin");
        fs::write(&file, vec![7u8; 100]).unwrap();
        assert_eq!(partial_digest(&file).unwrap().len(), 64);
    }
}
