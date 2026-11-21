# Changelog

All notable changes to ZenDisk are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Tauri v2 desktop shell, signed NSIS updater, and Windows CI publishing.
- Phase 3–5 UI: main screens, advanced screens, local fonts, AA tokens,
  keyboard shortcuts, responsive bands, and permission-denied states.
- Phase 6 native foundation: typed facade, Rust commands for disk analysis,
  cleanup/quarantine, duplicates (BLAKE3), metrics, SQLite history, smoke mode,
  and an updater UI in Settings.
- Windows CI smoke gate: native `--smoke`, silent installer launch, and
  uninstall (green on CI run `44889269615`).

### Notes

- Native coverage is partial: Task Scheduler, SMART, startup/applications,
  WMI/registry parsing, parallel hashing, and a 500k-file benchmark remain
  open. Unsupported capabilities report "Not available" rather than a value.
- Real Windows hardware verification (install, upgrade, OTA, SMART,
  permissions) is still required before a stable channel is declared.
