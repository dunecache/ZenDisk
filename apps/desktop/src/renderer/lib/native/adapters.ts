/**
 * Adapters between native command payloads and the renderer's view models.
 *
 * Rust returns honest, minimal payloads (Unix-second timestamps, no derived
 * category/color, no capacity snapshot). Mapping happens here so screens keep
 * their existing typed props and never invent measurements.
 */
import { formatBytes } from "@/lib/formatters";
import type {
  NativeAnalysisData,
  NativeCleanupCandidate,
  NativeDiskInfo,
  NativeDuplicateGroup,
  NativeFileEntry,
  NativeTreeNode,
} from "@/lib/native/client";
import type {
  ActivityEvent,
  AnalysisData,
  CleanupData,
  DiskEntry,
  DriveInfo,
  DuplicateGroup,
  DuplicatesData,
  FileTypeStat,
  OperationRecord,
  Recommendation,
  ReportMetrics,
  ReportsData,
  ScanState,
  TreeNode,
} from "@/types";

const DAY_MS = 86_400_000;

const CATEGORY_COLORS: Record<string, string> = {
  Documents: "var(--chart-documents)",
  Images: "var(--chart-images)",
  Videos: "var(--chart-videos)",
  Audio: "var(--chart-audio)",
  Archives: "var(--chart-archives)",
  Applications: "var(--chart-applications)",
  System: "var(--chart-system)",
  Other: "var(--chart-other)",
};

const EXTENSION_CATEGORIES: Record<string, string> = {
  png: "Images", jpg: "Images", jpeg: "Images", gif: "Images", webp: "Images",
  bmp: "Images", svg: "Images", heic: "Images", tif: "Images", tiff: "Images",
  mp4: "Videos", mkv: "Videos", avi: "Videos", mov: "Videos", wmv: "Videos",
  webm: "Videos", m4v: "Videos",
  mp3: "Audio", wav: "Audio", flac: "Audio", aac: "Audio", ogg: "Audio",
  m4a: "Audio",
  zip: "Archives", rar: "Archives", "7z": "Archives", tar: "Archives",
  gz: "Archives", iso: "Archives", vhdx: "Archives", vmdk: "Archives",
  pdf: "Documents", doc: "Documents", docx: "Documents", xls: "Documents",
  xlsx: "Documents", ppt: "Documents", pptx: "Documents", txt: "Documents",
  csv: "Documents", md: "Documents",
  exe: "Applications", msi: "Applications", dll: "Applications",
};

/** Rust timestamps are Unix seconds (or an ISO string); the UI expects ISO. */
export function toIsoTimestamp(value: string): string {
  const trimmed = value.trim();
  if (/^\d{9,13}$/.test(trimmed)) {
    const seconds = Number(trimmed);
    return new Date(seconds < 1e11 ? seconds * 1000 : seconds).toISOString();
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

/** `disk_list` ids may be drive letters; `disk_analyze` requires an absolute path. */
export function toNativeRoot(driveId: string): string {
  const trimmed = driveId.trim();
  return /^[A-Za-z]:$/.test(trimmed) ? `${trimmed}\\` : trimmed;
}

export function driveInfoFromNative(disk: NativeDiskInfo): DriveInfo {
  return {
    id: disk.id,
    name: disk.name,
    letter: disk.letter ?? undefined,
    filesystem: disk.filesystem,
    capacity: disk.capacity,
    free: disk.free,
  };
}

function categoryFor(name: string, isDirectory: boolean): string {
  if (isDirectory) {
    const lower = name.toLowerCase();
    if (/^(windows|system32|programdata|\$recycle\.bin)$/.test(lower)) return "System";
    if (lower.startsWith("program files")) return "Applications";
    if (/^(users|documents|desktop)$/.test(lower)) return "Documents";
    if (/^(photos?|pictures?)$/.test(lower)) return "Images";
    if (lower.startsWith("video")) return "Videos";
    if (lower === "music") return "Audio";
    if (lower === "downloads") return "Archives";
    return "Other";
  }
  const extension = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  return EXTENSION_CATEGORIES[extension] ?? "Other";
}

function colorFor(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
}

export function treeNodesFromNative(nodes: NativeTreeNode[]): TreeNode[] {
  return nodes.map((node) => {
    const category = categoryFor(node.name, true);
    return {
      id: node.id,
      name: node.name,
      sizeBytes: node.sizeBytes,
      path: node.path,
      category,
      color: colorFor(category),
      children: node.children.length ? treeNodesFromNative(node.children) : undefined,
    };
  });
}

/** Aggregate leaf sizes by derived category, ignoring container nodes. */
export function breakdownFromTree(nodes: TreeNode[]): FileTypeStat[] {
  const totals = new Map<string, number>();
  const walk = (items: TreeNode[]) => {
    for (const node of items) {
      if (node.children?.length) {
        walk(node.children);
      } else {
        totals.set(node.category, (totals.get(node.category) ?? 0) + node.sizeBytes);
      }
    }
  };
  walk(nodes);
  return [...totals.entries()]
    .map(([category, bytes]) => ({ category, bytes, color: colorFor(category) }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function fileEntryFromNative(entry: NativeFileEntry, isDirectory: boolean): DiskEntry {
  return {
    id: entry.id,
    name: entry.name,
    path: entry.path,
    sizeBytes: entry.sizeBytes,
    modifiedAt: toIsoTimestamp(entry.modifiedAt),
    isDirectory,
  };
}

function scanStateFromNative(state: string): ScanState {
  switch (state) {
    case "completed":
    case "cancelled":
    case "failed":
    case "partial":
    case "idle":
    case "discovering":
    case "scanning":
    case "paused":
      return state;
    default:
      return "failed";
  }
}

export function analysisDataFromNative(
  native: NativeAnalysisData,
  drive: NativeDiskInfo,
  driveId: string,
): AnalysisData {
  const tree = treeNodesFromNative(native.tree);
  return {
    driveId,
    capacity: drive.capacity,
    free: drive.free,
    scannedBytes: native.scannedBytes,
    scannedItems: native.scannedItems,
    scanState: scanStateFromNative(native.scanState),
    isPartial: native.isPartial,
    typeBreakdown: breakdownFromTree(tree),
    largestFiles: native.largestFiles.map((file) => fileEntryFromNative(file, false)),
    largestFolders: native.largestFolders.map((folder) => fileEntryFromNative(folder, true)),
    tree,
    skippedLocations: native.skippedLocations,
    skipCounts: native.skipCounts,
    budgetExceeded: native.budgetExceeded,
  };
}

const CLEANUP_META: Record<string, { name: string; description: string; warning?: string }> = {
  temp: {
    name: "Temporary files",
    description: "Files created by applications that are no longer in use.",
  },
  cache: {
    name: "Application cache",
    description: "Cached data that can be regenerated on demand.",
  },
  installers: {
    name: "Old installers",
    description: "Setup files left behind after installation.",
    warning: "Some installers may be needed to repair or uninstall applications.",
  },
  logs: {
    name: "Logs",
    description: "Diagnostic logs from applications and services.",
  },
};

export function cleanupDataFromNative(candidates: NativeCleanupCandidate[]): CleanupData {
  return {
    categories: candidates.map((candidate) => {
      const files = candidate.files.map((file) => fileEntryFromNative(file, false));
      const meta = CLEANUP_META[candidate.category] ?? {
        name: candidate.category,
        description: "Files found in a temporary location.",
        warning: "Review every file before removing it.",
      };
      return {
        id: candidate.category,
        name: meta.name,
        description: meta.description,
        warning: meta.warning,
        bytes: files.reduce((total, file) => total + file.sizeBytes, 0),
        fileCount: files.length,
        files,
      };
    }),
  };
}

export function duplicatesDataFromNative(groups: NativeDuplicateGroup[]): DuplicatesData {
  return {
    groups: groups.map(
      (group): DuplicateGroup => ({
        id: group.id,
        kind: "exact",
        verification: group.verification,
        algorithm: group.algorithm,
        files: group.files.map((file) => ({
          id: file.id,
          name: file.name,
          path: file.path,
          sizeBytes: file.sizeBytes,
          modifiedAt: toIsoTimestamp(file.modifiedAt),
        })),
      }),
    ),
  };
}

export function activityFromOperation(record: OperationRecord): ActivityEvent {
  const kind =
    record.kind === "cleanup" || record.kind === "organize" || record.kind === "duplicates"
      ? record.kind
      : "maintenance";
  const details = [`${record.completed} of ${record.total} files processed`];
  if (record.failed) details.push(`${record.failed} failed`);
  if (record.reclaimedBytes) details.push(`${formatBytes(record.reclaimedBytes)} reclaimed`);
  return {
    id: record.id,
    kind,
    title: record.title,
    detail: details.join(" · "),
    at: toIsoTimestamp(record.at),
  };
}

function timestampOf(record: OperationRecord): number {
  return new Date(toIsoTimestamp(record.at)).getTime();
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

function sum(records: OperationRecord[], pick: (record: OperationRecord) => number): number {
  return records.reduce((total, record) => total + pick(record), 0);
}

function metricsFor(records: OperationRecord[], days: number): ReportMetrics {
  const now = Date.now();
  const start = now - days * DAY_MS;
  const inRange = (from: number, to: number) =>
    records.filter((record) => {
      const at = timestampOf(record);
      return at >= from && at < to;
    });
  const current = inRange(start, now);
  const previous = inRange(start - days * DAY_MS, start);

  const recovered = (items: OperationRecord[]) =>
    sum(items.filter((record) => record.kind === "cleanup"), (record) => record.reclaimedBytes);
  const duplicates = (items: OperationRecord[]) =>
    sum(items.filter((record) => record.kind === "duplicates"), (record) => record.reclaimedBytes);
  const organized = (items: OperationRecord[]) =>
    sum(items.filter((record) => record.kind === "organize"), (record) => record.completed);

  return {
    recoveredBytes: recovered(current),
    recoveredDelta: percentChange(recovered(current), recovered(previous)),
    duplicatesBytes: duplicates(current),
    duplicatesDelta: percentChange(duplicates(current), duplicates(previous)),
    organizedFiles: organized(current),
    organizedDelta: percentChange(organized(current), organized(previous)),
  };
}

export function recommendationsFromData(
  drives: DriveInfo[],
  records: OperationRecord[],
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  for (const drive of drives) {
    if (drive.capacity > 0 && drive.free / drive.capacity < 0.15) {
      recommendations.push({
        id: `low-space-${drive.id}`,
        title: `Free space is low on ${drive.name}`,
        evidence: `${formatBytes(drive.free)} of ${formatBytes(drive.capacity)} remains on ${drive.letter ?? drive.name}.`,
        route: "/cleanup",
      });
    }
  }
  if (records.some((record) => record.kind === "duplicates")) {
    recommendations.push({
      id: "duplicates-history",
      title: "Review duplicate results",
      evidence: "Duplicate scans are recorded in operation history.",
      route: "/duplicates",
    });
  }
  return recommendations;
}

export function reportsDataFromOperations(
  records: OperationRecord[],
  drives: DriveInfo[],
): ReportsData {
  return {
    access: "granted",
    collectedAt: new Date().toISOString(),
    metrics: {
      "7": metricsFor(records, 7),
      "30": metricsFor(records, 30),
      "90": metricsFor(records, 90),
    },
    // No historical free/used snapshots are collected yet; no values are invented.
    storage: [],
    activity: records.map(activityFromOperation),
    recommendations: recommendationsFromData(drives, records),
  };
}
