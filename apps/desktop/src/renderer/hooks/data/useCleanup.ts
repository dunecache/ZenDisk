import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import { cleanupDataFromNative } from "@/lib/native/adapters";
import { fetchCleanup } from "@/lib/native/mock-cleanup";
import type { CleanupData } from "@/types";

export const cleanupKeys = { all: ["cleanup"] as const };

/** Real temporary-file candidates when installed; demo data in the preview. */
export function useCleanup() {
  return useQuery({
    queryKey: cleanupKeys.all,
    queryFn: () =>
      withFallback<CleanupData>(
        async () => cleanupDataFromNative(await nativeApi.cleanup.candidates()),
        fetchCleanup,
      ),
    staleTime: 30_000,
  });
}
