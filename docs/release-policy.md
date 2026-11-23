# Release policy

## Channels

- The rolling `windows-latest` pre-release is the **beta channel**. Every push
  to `main` publishes `0.1.<run_number>` there, with `latest.json` uploaded
  last.
- A stable channel exists as the `v0.1.31` GitHub Release, published
  2026-11-23 from CI run `45132647464` at the user's request. It carries the
  CI-signed installer, its `.sig`, and the generated `latest.json`. Its clean
  install was verified on Windows hardware the same day; upgrade, OTA, SMART,
  and permission paths remain unverified. Future stable tags should follow a
  clean Windows 10/11 verification (Phase 7 manual checks).
- A rolling `windows-stable` release is the **stable channel**. CI publishes to
  it only on an explicit `workflow_dispatch` with `channel=stable`; ordinary
  pushes to `main` keep updating `windows-latest` alone. Both channels receive
  the same signed installer and a `latest.json` whose asset URL points at that
  channel's own release.
- The installed-app updater endpoint is
  `https://github.com/dunecache/ZenDisk/releases/download/windows-stable/latest.json`.
  Versioned stable tags such as `v0.1.31` remain one-off historical artifacts
  and are not the update feed.
- PR builds never publish and never need signing secrets.

## Signing

The installer is signed with the Tauri updater key (minisign) so the updater can
verify downloads. There is no Authenticode certificate, so Windows SmartScreen
may warn on first run; each stable release's notes state this explicitly. An
Authenticode decision remains open.

## Uninstall behaviour

- Planned: the NSIS uninstaller will remove the `\ZenDisk\` Windows Task
  Scheduler tasks so no headless action survives the application. This is **not
  implemented yet** (Phase 6.5); no tasks are created today.
- Preferences, operation history, and quarantined files under
  `%APPDATA%\ZenDisk` are **kept** by default. Silently deleting user data on
  uninstall would destroy the audit trail and recovery copies.
- A future "Remove all ZenDisk data" action must be explicit and confirmed;
  it does not exist yet.

## Changelog practice

- `CHANGELOG.md` follows Keep a Changelog with an `Unreleased` section.
- Each published build adds a dated entry with the run number and a short
  summary. The generated `latest.json` notes contain the build SHA; they do not
  yet link to a changelog entry.
- Manual/hardware-only verification items are called out in the entry rather
  than implied complete.

## Key custody

- The updater key is password-protected; key and password must be backed up in
  a password manager plus one offline copy.
- Future rotations use the bridge-release procedure in
  `docs/updater-key-rotation.md`.
