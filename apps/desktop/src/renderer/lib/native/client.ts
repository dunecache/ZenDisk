/**
 * Typed native-API boundary for the renderer.
 *
 * React components must call this facade — never `@tauri-apps/api` or plugin
 * packages directly. This is the single allowlisted surface for privileged
 * operations, and the place where inputs/outputs get validated (Zod).
 *
 * Tauri commands and plugin permissions live in
 * `apps/desktop/src-tauri/capabilities/default.json`.
 */

import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

type Operation = (...args: never[]) => Promise<unknown>;

function notImplemented(name: string): Operation {
  return (async () => {
    throw new Error(`[${name}] native operation is not implemented yet`);
  }) as Operation;
}

/**
 * Logical frontend operations. Names mirror the ZenDisk spec. Tauri-backed
 * implementations (custom `invoke()` commands or plugin bindings) are added as
 * features are built; today only the app version uses real IPC.
 */
export const nativeApi = {
  app: {
    version: () => getVersion(),
  },
  updates: {
    check: () => check(),
    install: async () => {
      const update = await check();
      if (!update) return false;
      await update.downloadAndInstall();
      await relaunch();
      return true;
    },
  },
  disk: {
    list: notImplemented("disk.list"),
    analyze: notImplemented("disk.analyze"),
  },
  files: {
    list: notImplemented("files.list"),
    inspect: notImplemented("files.inspect"),
  },
  cleanup: {
    preview: notImplemented("cleanup.preview"),
    execute: notImplemented("cleanup.execute"),
  },
  organizer: {
    preview: notImplemented("organizer.preview"),
    execute: notImplemented("organizer.execute"),
  },
  duplicates: {
    scan: notImplemented("duplicates.scan"),
  },
  operations: {
    history: notImplemented("operations.history"),
  },
} as const;
