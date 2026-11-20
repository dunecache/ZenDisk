/** Demo analysis data. Swap at the query hook boundary when native lands. */
import type { AnalysisData, TreeNode } from "@/types";

const GB = 1024 ** 3;
const MB = 1024 ** 2;

const tree: TreeNode[] = [
  { id: "doc", name: "Documents", sizeBytes: 42 * GB, category: "Documents", color: "var(--chart-documents)", path: "C:/Users/me/Documents" },
  { id: "img", name: "Photos", sizeBytes: 28 * GB, category: "Images", color: "var(--chart-images)", path: "C:/Users/me/Photos" },
  { id: "vid", name: "Videos", sizeBytes: 19 * GB, category: "Videos", color: "var(--chart-videos)", path: "C:/Users/me/Videos" },
  { id: "aud", name: "Music", sizeBytes: 11 * GB, category: "Audio", color: "var(--chart-audio)", path: "C:/Users/me/Music" },
  { id: "arc", name: "Archives", sizeBytes: 8 * GB, category: "Archives", color: "var(--chart-archives)", path: "C:/Users/me/Archives" },
  { id: "app", name: "Applications", sizeBytes: 24 * GB, category: "Applications", color: "var(--chart-applications)", path: "C:/Program Files" },
  { id: "sys", name: "System", sizeBytes: 16 * GB, category: "System", color: "var(--chart-system)", path: "C:/Windows" },
  { id: "oth", name: "Other", sizeBytes: 5 * GB, category: "Other", color: "var(--chart-other)", path: "C:/Other" },
];

const files = [
  { id: "f1", name: "project_archive.zip", path: "C:/Users/me/Downloads", sizeBytes: 3400 * MB, modifiedAt: new Date(Date.now() - 86400000 * 3).toISOString(), isDirectory: false },
  { id: "f2", name: "dataset_final.mp4", path: "C:/Users/me/Videos", sizeBytes: 2100 * MB, modifiedAt: new Date(Date.now() - 86400000 * 9).toISOString(), isDirectory: false },
  { id: "f3", name: "vm_disk.vhdx", path: "D:/VMs", sizeBytes: 8400 * MB, modifiedAt: new Date(Date.now() - 86400000 * 21).toISOString(), isDirectory: false },
  { id: "f4", name: "photo_set_2024.zip", path: "C:/Users/me/Photos", sizeBytes: 1750 * MB, modifiedAt: new Date(Date.now() - 86400000 * 34).toISOString(), isDirectory: false },
];

export function analysisForDrive(driveId: string): AnalysisData {
  const isD = driveId.toUpperCase().startsWith("D");
  return {
    driveId,
    capacity: isD ? 2 * 1024 * GB : 512 * GB,
    free: isD ? 446 * GB : 186 * GB,
    scannedBytes: isD ? 1420 * GB : 280 * GB,
    scannedItems: isD ? 182304 : 84192,
    scanState: "completed",
    isPartial: false,
    typeBreakdown: tree.map((node) => ({
      category: node.category,
      bytes: node.sizeBytes,
      color: node.color,
    })),
    largestFiles: files,
    largestFolders: tree.map((node) => ({
      id: node.id,
      name: node.name,
      path: node.path,
      sizeBytes: node.sizeBytes,
      modifiedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      isDirectory: true,
    })),
    tree,
  };
}

export function fetchAnalysis(driveId: string): Promise<AnalysisData> {
  return new Promise((resolve) => setTimeout(() => resolve(analysisForDrive(driveId)), 300));
}
