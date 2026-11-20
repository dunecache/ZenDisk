import type { CleanupCategory, CleanupData } from "@/types";

const MB = 1024 ** 2;
const GB = 1024 ** 3;

function files(prefix: string, count: number, size: number, start = 0): CleanupCategory["files"] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix}_${start + index}.tmp`,
    path: `C:/Users/me/AppData/Local/Temp/${prefix}`,
    sizeBytes: size,
    modifiedAt: new Date(Date.now() - 86400000 * (index + 1)).toISOString(),
  }));
}

export const cleanupData: CleanupData = {
  categories: [
    {
      id: "temp",
      name: "Temporary files",
      description: "Files created by applications that are no longer in use.",
      bytes: 2.1 * GB,
      fileCount: 412,
      files: files("temp", 8, 48 * MB),
    },
    {
      id: "cache",
      name: "Application cache",
      description: "Cached data that can be regenerated on demand.",
      bytes: 1.5 * GB,
      fileCount: 1260,
      files: files("cache", 8, 24 * MB, 100),
    },
    {
      id: "installers",
      name: "Old installers",
      description: "Setup files left behind after installation.",
      bytes: 1.2 * GB,
      fileCount: 37,
      warning: "Some installers may be needed to repair or uninstall applications.",
      files: files("setup", 6, 120 * MB, 200),
    },
    {
      id: "logs",
      name: "Logs",
      description: "Diagnostic logs from applications and services.",
      bytes: 0.4 * GB,
      fileCount: 89,
      files: files("log", 6, 12 * MB, 300),
    },
  ],
};

export function fetchCleanup(): Promise<CleanupData> {
  return new Promise((resolve) => setTimeout(() => resolve(cleanupData), 300));
}
