import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// Revision survives component unmount, so switching tabs cannot mint a new job
// id (and therefore cannot start a fresh native scan) for the same drive.
const scanRevisions = new Map<string, number>();
const revisionFor = (driveId: string) => scanRevisions.get(driveId) ?? 0;

function jobFor(driveId: string, revision: number) {
  const slug = driveId.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 32);
  return `scan-${slug}-${revision}`;
}

/** Runs a cancellable native scan and maps its payload into the view model. */
export function useAnalysis(driveId: string) {
  const [revision, setRevision] = useState(() => revisionFor(driveId));
  const [paused, setPaused] = useState(false);
  const jobId = useMemo(() => jobFor(driveId, revision), [driveId, revision]);

  // Restore the persisted revision when the drive changes in place.
  useEffect(() => { setRevision(revisionFor(driveId)); }, [driveId]);

  // Cancel only the *previous* job when it is replaced (drive change or an
  // explicit rescan). Leaving the tab must not cancel a running native scan.
  const previousJob = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousJob.current;
    if (previous && previous !== jobId) void nativeApi.disk.cancel(previous);
    previousJob.current = jobId;
  }, [jobId]);

  useEffect(() => { setPaused(false); }, [jobId]);

  const query = useQuery({
    // A stable key keeps the cached result across tab switches; only an
    // explicit rescan changes the job id and starts new work.
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
    retry: false,
  });

  const rescan = useCallback(() => {
    const next = revisionFor(driveId) + 1;
    scanRevisions.set(driveId, next);
    setRevision(next);
  }, [driveId]);

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
