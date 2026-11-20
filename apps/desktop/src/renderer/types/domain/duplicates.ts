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
  files: DuplicateFile[];
}

export interface DuplicatesData {
  groups: DuplicateGroup[];
}
