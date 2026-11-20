import type { CleanupCategory, CleanupData } from "@/types";

const GB = 1024 ** 3;

function category(
  id: string,
  name: string,
  description: string,
  bytes: number,
  count: number,
  prefix: string,
  warning?: string,
): CleanupCategory {
  return {
    id,
    name,
    description,
    bytes,
    fileCount: count,
    warning,
    // The preview lists every file the confirmation counts, so the review
    // never claims more files than it actually shows.
    files: Array.from({ length: count }, (_, index) => ({
      id: `${prefix}-${index}`,
      name: `${prefix}_${index}.tmp`,
      path: `C:/Users/me/AppData/Local/Temp/${prefix}`,
      sizeBytes: bytes / count,
      modifiedAt: new Date(Date.now() - 86_400_000 * (index + 1)).toISOString(),
    })),
  };
}

export const cleanupData: CleanupData = {
  categories: [
    category("temp", "Temporary files", "Files created by applications that are no longer in use.", 2.1 * GB, 412, "temp"),
    category("cache", "Application cache", "Cached data that can be regenerated on demand.", 1.5 * GB, 1260, "cache"),
    category(
      "installers",
      "Old installers",
      "Setup files left behind after installation.",
      1.2 * GB,
      37,
      "setup",
      "Some installers may be needed to repair or uninstall applications.",
    ),
    category("logs", "Logs", "Diagnostic logs from applications and services.", 0.4 * GB, 89, "log"),
  ],
};

export function fetchCleanup(): Promise<CleanupData> {
  return new Promise((resolve) => setTimeout(() => resolve(cleanupData), 300));
}
