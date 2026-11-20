import type { Status } from "@/components/data-display/metrics/StatusBadge";

export type ScanState =
  | "idle"
  | "discovering"
  | "scanning"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed";

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
