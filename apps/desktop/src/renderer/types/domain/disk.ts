import type { Status } from "@/components/data-display/metrics/StatusBadge";

export type ScanState =
  | "idle"
  | "discovering"
  | "scanning"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "partial";

export type ScanSkipKind = "unreadable" | "excluded" | "reparse" | "budget";

export interface SkipCounts {
  unreadable: number;
  excluded: number;
  reparse: number;
  budget: number;
}

export interface ScanSkippedLocation {
  path: string;
  reason: string;
  kind: ScanSkipKind;
}

export interface FileTypeStat {
  category: string;
  bytes: number;
  color: string;
}

export interface DiskEntry {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  isDirectory: boolean;
}

export interface AnalysisData {
  driveId: string;
  capacity: number;
  free: number;
  scannedBytes: number;
  scannedItems: number;
  scanState: ScanState;
  isPartial: boolean;
  typeBreakdown: FileTypeStat[];
  largestFiles: DiskEntry[];
  largestFolders: DiskEntry[];
  tree: TreeNode[];
  /** Locations the scanner could not read; empty for a complete scan. */
  skippedLocations: ScanSkippedLocation[];
  /** Counts for every skip, including those beyond the sampled locations. */
  skipCounts: SkipCounts;
  /** True when the item/time budget stopped the scan before the whole drive. */
  budgetExceeded: boolean;
}

export interface TreeNode {
  id: string;
  name: string;
  sizeBytes: number;
  category: string;
  color: string;
  path: string;
  children?: TreeNode[];
}
