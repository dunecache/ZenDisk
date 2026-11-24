import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import { analysisDataFromNative, toNativeRoot } from "@/lib/native/adapters";
import { fetchAnalysis } from "@/lib/native/mock-analysis";
import type { AnalysisData } from "@/types";

export const analysisKeys = {
  all: ["analysis"] as const,
  byDrive: (driveId: string) => ["analysis", driveId] as const,
};

/** Runs a cancellable native scan and maps its payload into the view model. */
export function useAnalysis(driveId: string) {
  const [revision, setRevision] = useState(0);
  const [paused, setPaused] = useState(false);
  const jobId = useMemo(
    () => `job-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${revision}`,
    [driveId, revision],
  );

  // Cancel the previous native scan when the drive changes, the user rescans,
  // or this screen unmounts; otherwise full-drive scans accumulate.
  useEffect(() => () => { void nativeApi.disk.cancel(jobId); }, [jobId]);
  useEffect(() => { setPaused(false); }, [jobId]);

  const query = useQuery({
    // A new job id starts a fresh scan instead of replaying a cached result.
    queryKey: [...analysisKeys.byDrive(driveId), jobId] as const,
    queryFn: () =>
      withFallback<AnalysisData>(
        async () => {
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
    // Retrying a full-drive scan doubles the work and delays real errors.
    retry: false,
  });

  const rescan = useCallback(() => setRevision((value) => value + 1), []);

  const setScanPaused = useCallback(async (value: boolean) => {
    try {
      const applied = await nativeApi.disk.pause(jobId, value);
      if (applied) setPaused(value);
    } catch {
      // Keep the last known state; an unsupported job does not change the UI.
    }
  }, [jobId]);

  const pause = useCallback(() => { void setScanPaused(true); }, [setScanPaused]);
  const resume = useCallback(() => { void setScanPaused(false); }, [setScanPaused]);

  const cancel = useCallback(async () => {
    await nativeApi.disk.cancel(jobId);
    setPaused(false);
  }, [jobId]);

  return { ...query, jobId, rescan, pause, resume, cancel, paused };
}
