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
  skippedLocations: {
    path: string;
    reason: string;
    kind: "unreadable" | "excluded" | "reparse" | "budget";
  }[];
  skipCounts: {
    unreadable: number;
    excluded: number;
    reparse: number;
    budget: number;
  };
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

export interface NativeIndexCounts {
  discovered: number;
  new: number;
  unchanged: number;
  metadataVerified: number;
  analyzeScheduled: number;
  analyzed: number;
  ignored: number;
  deferred: number;
  failed: number;
  moved: number;
  missing: number;
}

export interface NativeIndexStatus {
  root: string;
  generation: number;
  status: string;
  fresh: boolean;
  pendingDirs: number;
  pendingWork: number;
  lastScanAt: string | null;
  budgetExceeded: boolean;
  needsReconciliation: boolean;
  counts: NativeIndexCounts;
}

export interface NativeIndexStats {
  totalFiles: number;
  totalBytes: number;
  pendingWork: number;
  byStatus: Record<string, number>;
  byKind: Record<string, number>;
}

export interface NativeIndexConfig {
  excludedNames: string[];
  excludedSegments: string[];
  excludedExtensions: string[];
  maxItemsPerRun: number;
  maxMillisPerRun: number;
  batchSize: number;
  progressIntervalMs: number;
  metadataRecheckSecs: number;
  maxRetryAttempts: number;
  retryBaseSecs: number;
  maxContentBytes: number;
  partialFingerprintBytes: number;
  fingerprintUnreliableTimestamps: boolean;
  expensiveExtensions: string[];
}

export interface NativeScanReport {
  root: string;
  generation: number;
  state: string;
  fresh: boolean;
  budgetExceeded: boolean;
  counts: NativeIndexCounts;
}

export interface NativeWorkReport {
  processed: number;
  ok: number;
  failed: number;
  reanalysed: number;
  fingerprintReused: number;
}

export interface NativeReconcileReport {
  moved: number;
  missing: number;
  dirsMissing: number;
}

export interface NativeChangeEvent {
  path: string;
  kind: "created" | "modified" | "renamed" | "deleted" | "overflow";
  oldPath?: string | null;
  at: string;
}

export interface NativeIndexedFile {
  path: string;
  name: string;
  extension: string;
  contentKind: string;
  sizeBytes: number;
  modifiedAt: string;
  analysisStatus: string;
  analysisVersion: number;
  classification: string;
  metadataVerifiedAt: string;
  contentAnalyzedAt: string | null;
  fingerprint: string | null;
  generation: number;
  state: string;
}

export interface NativeIndexProgress {
  jobId: string;
  root: string;
  generation: number;
  phase: string;
  counts: NativeIndexCounts;
  budgetExceeded: boolean;
  pendingWork?: number;
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
    pause: (jobId: string, pause: boolean) =>
      invoke<boolean>("analyze_pause", { jobId: jobIdSchema.parse(jobId), pause }),
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
  index: {
    status: (root: string) =>
      invoke<NativeIndexStatus | null>("index_status", { root: pathSchema.parse(root) }),
    discover: (root: string, jobId: string, force = false) =>
      invoke<NativeScanReport>("index_discover", {
        root: pathSchema.parse(root),
        jobId: jobIdSchema.parse(jobId),
        force,
      }),
    process: (root: string, limit = 200) =>
      invoke<NativeWorkReport>("index_process", { root: pathSchema.parse(root), limit }),
    reconcile: (root: string) =>
      invoke<NativeReconcileReport>("index_reconcile", { root: pathSchema.parse(root) }),
    applyChanges: (events: NativeChangeEvent[]) =>
      invoke<{ accepted: number; overflow: boolean }>("index_apply_changes", {
        events: events.map((event) => ({
          ...event,
          path: pathSchema.parse(event.path),
          oldPath: event.oldPath ? pathSchema.parse(event.oldPath) : null,
        })),
      }),
    query: (root: string, parent?: string, limit = 200, offset = 0) =>
      invoke<NativeIndexedFile[]>("index_query", {
        root: pathSchema.parse(root),
        parent: parent ? pathSchema.parse(parent) : null,
        limit,
        offset,
      }),
    stats: (root: string) =>
      invoke<NativeIndexStats>("index_stats", { root: pathSchema.parse(root) }),
    config: (config?: NativeIndexConfig) =>
      invoke<NativeIndexConfig>("index_config", { config: config ?? null }),
    reset: (root: string) => invoke<boolean>("index_reset", { root: pathSchema.parse(root) }),
    onProgress: (handler: (progress: NativeIndexProgress) => void) =>
      listen<NativeIndexProgress>("zendisk://index-progress", (event) => handler(event.payload)),
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
