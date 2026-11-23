import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import {
  analysisDataFromNative,
  toNativeRoot,
} from "@/lib/native/adapters";
import { fetchAnalysis } from "@/lib/native/mock-analysis";
import type { AnalysisData } from "@/types";

export const analysisKeys = {
  all: ["analysis"] as const,
  byDrive: (driveId: string) => ["analysis", driveId] as const,
};

/** Runs a real native scan and maps its payload into the analysis view model. */
export function useAnalysis(driveId: string) {
  return useQuery({
    queryKey: analysisKeys.byDrive(driveId),
    queryFn: () =>
      withFallback<AnalysisData>(
        async () => {
          const jobId = `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          const root = toNativeRoot(driveId);
          const [native, disks] = await Promise.all([
            nativeApi.disk.analyze(root, jobId),
            nativeApi.disk.list(),
          ]);
          const drive = disks.find(
            (candidate) =>
              candidate.id === driveId ||
              candidate.letter === driveId ||
              candidate.name === driveId ||
              toNativeRoot(candidate.id) === root,
          );
          if (!drive) throw new Error("Drive information is not available for this scan");
          return analysisDataFromNative(native, drive, driveId);
        },
        () => fetchAnalysis(driveId),
      ),
    enabled: Boolean(driveId),
    staleTime: 30_000,
  });
}
