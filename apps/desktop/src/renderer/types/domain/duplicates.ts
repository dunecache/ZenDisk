export type DuplicateTab = "exact" | "names" | "images" | "media";

export interface DuplicateFile {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
  hash?: string;
}

export interface DuplicateGroup {
  id: string;
  kind: DuplicateTab;
  hash?: string;
  /** Reported by the native pipeline; absent in browser-preview mock data. */
  verification?: "size" | "partial" | "full";
  algorithm?: string;
  files: DuplicateFile[];
}

export interface DuplicatesData {
  groups: DuplicateGroup[];
}
