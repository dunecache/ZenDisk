# Release policy

## Channels

- The rolling `windows-latest` pre-release is the **beta channel**. Every push
  to `main` publishes `0.1.<run_number>` there, with `latest.json` uploaded
  last.
- There is no stable channel yet. A stable tag should be introduced only after
  a clean Windows 10/11 hardware pass (Phase 7 manual checks). Until then, the
  updater endpoint remains `windows-latest`.
- PR builds never publish and never need signing secrets.

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
