export interface CleanupCategory {
  id: string;
  name: string;
  description: string;
  bytes: number;
  fileCount: number;
  /** Categories are never implicitly safe — the UI must say so. */
  warning?: string;
  files: CleanupFile[];
}

export interface CleanupFile {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  modifiedAt: string;
}

export interface CleanupData {
  categories: CleanupCategory[];
}
