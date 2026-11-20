import type { Status } from "@/components/data-display/metrics/StatusBadge";

/** A file or folder row as presented by the file-system components. */
export interface FileEntry {
  id: string;
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedAt: string;
  status?: Status;
  children?: FileEntry[];
}
