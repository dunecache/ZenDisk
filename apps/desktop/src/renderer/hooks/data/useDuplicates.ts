import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import { duplicatesDataFromNative, toNativeRoot } from "@/lib/native/adapters";
import { fetchDuplicates } from "@/lib/native/mock-duplicates";
import type { DuplicatesData } from "@/types";

export const duplicatesKeys = { all: ["duplicates"] as const };

/** Scans a real drive root with the native BLAKE3 pipeline when installed. */
export function useDuplicates() {
  return useQuery({
    queryKey: duplicatesKeys.all,
    queryFn: () =>
      withFallback<DuplicatesData>(
        async () => {
          const drives = await nativeApi.disk.list();
          const rootDrive = drives[0];
          if (!rootDrive) return { groups: [] };
          const jobId = `dup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          const groups = await nativeApi.duplicates.scan(toNativeRoot(rootDrive.id), jobId);
          return duplicatesDataFromNative(groups);
        },
        fetchDuplicates,
      ),
    staleTime: 30_000,
  });
}
