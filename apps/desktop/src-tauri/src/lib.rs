mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::disk_list,
            commands::disk_analyze,
            commands::analyze_cancel,
            commands::analyze_pause,
            commands::files_list,
            commands::cleanup_preview,
            commands::cleanup_candidates,
            commands::cleanup_execute,
            commands::quarantine_restore,
            commands::organizer_preview,
            commands::duplicates_scan,
            commands::system_metrics,
            commands::disk_health,
            commands::startup_list,
            commands::apps_list,
            commands::automation_list,
            commands::automation_set,
            commands::operations_history,
            commands::reports_summary,
        ])
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .run(tauri::generate_context!())
        .expect("error while running ZenDisk");
}

/// Headless verification mode used by Windows CI. Exercises real commands
/// against a temporary directory and prints a JSON report.
pub fn smoke() -> std::result::Result<(), String> {
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    let unique = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    let root = std::env::temp_dir().join(format!("zendisk-smoke-{}", unique));
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    let a = root.join("a.bin");
    let b = root.join("b.bin");
    fs::write(&a, vec![1u8; 4096]).map_err(|e| e.to_string())?;
    fs::write(&b, vec![1u8; 4096]).map_err(|e| e.to_string())?;

    let list = commands::files_list_impl(root.to_string_lossy().into_owned()).map_err(|e| e.message)?;
    let preview = commands::cleanup_preview_impl(vec![a.to_string_lossy().into_owned()]).map_err(|e| e.message)?;
    let digest_a = commands::full_digest(&a).map_err(|e| e.message)?;
    let digest_b = commands::full_digest(&b).map_err(|e| e.message)?;
    let metrics = commands::system_metrics_impl().map_err(|e| e.message)?;
    let candidates = commands::cleanup_candidates_impl().map_err(|e| e.message)?;
    let report = serde_json::json!({
        "filesListed": list.len(),
        "previewFiles": preview.len(),
        "candidateGroups": candidates.len(),
        "hashesMatch": digest_a == digest_b,
        "metrics": metrics.len(),
        "tempRoot": PathBuf::from(&root).to_string_lossy(),
    });
    println!("{}", report);
    let _ = fs::remove_dir_all(&root);
    Ok(())
}
