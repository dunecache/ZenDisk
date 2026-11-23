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
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { relaunch } from "@tauri-apps/plugin-process";
import { load } from "@tauri-apps/plugin-store";
import { check } from "@tauri-apps/plugin-updater";
import { jobIdSchema, pathSchema } from "@/lib/validators";
import type {
  AutomationData,
  AutomationTask,
  DriveHealth,
  InstalledApplication,
  OperationRecord,
  SettingsData,
  StartupEntry,
} from "@/types";

export interface NativeDiskInfo {
  id: string;
  name: string;
  letter?: string | null;
  capacity: number;
  free: number;
  filesystem: string;
}

export interface NativeFileEntry {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface NativeCleanupCandidate {
  category: string;
  files: NativeFileEntry[];
}

export interface NativeDuplicateGroup {
  id: string;
  kind: string;
  files: NativeFileEntry[];
  verification: "size" | "partial" | "full";
  algorithm: string;
}

export interface NativeTreeNode {
  id: string;
  name: string;
  sizeBytes: number;
  path: string;
  children: NativeTreeNode[];
}

export interface NativeAnalysisData {
  driveId: string;
  scannedBytes: number;
  scannedItems: number;
  tree: NativeTreeNode[];
  largestFiles: NativeFileEntry[];
  largestFolders: NativeFileEntry[];
  isPartial: boolean;
  scanState: string;
  skippedLocations: { path: string; reason: string }[];
  budgetExceeded: boolean;
}

export interface NativeMetric {
  id: string;
  label: string;
  value: number;
  max: number;
  displayValue: string;
  detail: string;
  supported: boolean;
}

export interface NativeProgress {
  jobId: string;
  scannedBytes: number;
  scannedItems: number;
}

export const nativeApi = {
  app: {
    version: () => getVersion(),
    isTauri: () => isTauri(),
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
    list: () => invoke<NativeDiskInfo[]>("disk_list"),
    analyze: (driveId: string, jobId: string) => {
      const path = pathSchema.parse(driveId);
      const job = jobIdSchema.parse(jobId);
      return invoke<NativeAnalysisData>("disk_analyze", { driveId: path, jobId: job });
    },
    cancel: (jobId: string) => invoke<boolean>("analyze_cancel", { jobId: jobIdSchema.parse(jobId) }),
    onScanProgress: (handler: (progress: NativeProgress) => void) =>
      listen<NativeProgress>("zendisk://scan-progress", (event) => handler(event.payload)),
  },
  files: {
    list: (path: string) => invoke<NativeFileEntry[]>("files_list", { path: pathSchema.parse(path) }),
    inspect: async () => ({ supported: false as const, reason: "Native inspect is not available yet" }),
  },
  cleanup: {
    candidates: () => invoke<NativeCleanupCandidate[]>("cleanup_candidates"),
    preview: (paths: string[]) =>
      invoke<NativeFileEntry[]>("cleanup_preview", { paths: paths.map((path) => pathSchema.parse(path)) }),
    execute: (paths: string[]) =>
      invoke<OperationRecord>("cleanup_execute", { paths: paths.map((path) => pathSchema.parse(path)) }),
  },
  organizer: {
    preview: (paths: string[]) =>
      invoke<OperationRecord[]>("organizer_preview", { paths: paths.map((path) => pathSchema.parse(path)) }),
    execute: async () => ({ supported: false as const, reason: "Native organize apply is not available yet" }),
  },
  duplicates: {
    scan: (root: string, jobId: string) =>
      invoke<NativeDuplicateGroup[]>("duplicates_scan", {
        root: pathSchema.parse(root),
        jobId: jobIdSchema.parse(jobId),
      }),
  },
  operations: {
    history: () => invoke<OperationRecord[]>("operations_history"),
  },
  reports: {
    summary: () => invoke<OperationRecord[]>("reports_summary"),
  },
  maintenance: {
    metrics: () => invoke<NativeMetric[]>("system_metrics"),
    health: () => invoke<DriveHealth[]>("disk_health"),
    startup: () => invoke<StartupEntry[]>("startup_list"),
    applications: () => invoke<InstalledApplication[]>("apps_list"),
  },
  automation: {
    list: async (): Promise<AutomationData> => {
      const tasks = await invoke<AutomationTask[]>("automation_list");
      return {
        access: "granted",
        tasks,
        runs: [],
        collectedAt: new Date().toISOString(),
      };
    },
    set: (id: string, enabled: boolean) => invoke<boolean>("automation_set", { id, enabled }),
  },
  settings: {
    read: async (): Promise<SettingsData> => ({
      access: "granted",
      sections: [],
      currentVersion: await getVersion(),
      updatesEnabled: true,
    }),
    preferences: {
      load: async () => {
        const store = await load("preferences.json");
        return (await store.get<Record<string, unknown>>("preferences")) ?? {};
      },
      save: async (values: Record<string, unknown>) => {
        const store = await load("preferences.json");
        await store.set("preferences", values);
        await store.save();
      },
    },
  },
} as const;
