# Changelog

All notable changes to ZenDisk are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- First launch after install could show "Could not load storage information":
  operation history was queried before its SQLite table existed. The table is
  now created on first read, and Overview keeps showing real drive data if the
  activity feed fails.

### Notes

- Upgrade, OTA, SMART, and permission paths remain unverified on hardware.
- Organizer apply, Task Scheduler, and SMART/startup/application inventory are
  still unavailable; storage growth has no snapshot source yet and renders an
  empty state instead of invented values.

## [0.1.41] - 2026-11-23

Stable Windows release built by CI run `45147417234` from commit `a541188`.
Replaces the UI's mock data with real computer information wherever a native
source exists.

### Added

- Rolling `windows-stable` update channel, published by CI only on an explicit
  stable dispatch; configured as the installed-app updater endpoint.
- Native-first data: Overview drives and activity, Disk Analysis scans with
  live progress and cancellation, Cleanup candidates and quarantine, Duplicates,
  Reports, and Maintenance now read real values from Tauri commands. Mock data
  remains only in the browser preview. Preferences persist through the Tauri
  store plugin in the installed app.

### Notes

- Clean install of `v0.1.31` verified on Windows hardware (2026-11-23);
  this build passed CI smoke, install, and uninstall but has not been reinstalled
  on hardware yet.

## [0.1.31] - 2026-11-23

First stable Windows release. Built by CI run `45132647464` from commit
`0cde722` and published alongside the rolling `windows-latest` pre-release.

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
- The installer is signed with the Tauri updater key (minisign) but is not
  Authenticode-signed; Windows may show a SmartScreen warning.
- Install/upgrade/OTA behaviour was exercised on a CI VM, not on real hardware.
