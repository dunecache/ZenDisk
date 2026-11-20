export interface OperationRecord {
  id: string;
  kind: "cleanup" | "organize" | "duplicates" | "automation";
  title: string;
  at: string;
  completed: number;
  failed: number;
  skipped: number;
  total: number;
  reclaimedBytes: number;
  recoverable: boolean;
}
