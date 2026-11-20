import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis } from "@/lib/native/mock-analysis";

export const analysisKeys = {
  all: ["analysis"] as const,
  byDrive: (driveId: string) => ["analysis", driveId] as const,
};

/** Swap `fetchAnalysis` for a nativeApi.disk.analyze() call when ready. */
export function useAnalysis(driveId: string) {
  return useQuery({
    queryKey: analysisKeys.byDrive(driveId),
    queryFn: () => fetchAnalysis(driveId),
    enabled: Boolean(driveId),
    staleTime: 30_000,
  });
}
