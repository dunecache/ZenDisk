import { useQuery } from "@tanstack/react-query";
import { fetchCleanup } from "@/lib/native/mock-cleanup";

export const cleanupKeys = { all: ["cleanup"] as const };

/** Swap `fetchCleanup` for nativeApi.cleanup.preview() when ready. */
export function useCleanup() {
  return useQuery({
    queryKey: cleanupKeys.all,
    queryFn: fetchCleanup,
    staleTime: 30_000,
  });
}
