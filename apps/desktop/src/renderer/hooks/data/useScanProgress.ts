import { useEffect, useState } from "react";
import { nativeApi, type NativeProgress } from "@/lib/native/client";

/** Live progress for the active native scan, filtered to one job id. */
export function useScanProgress(jobId: string): NativeProgress | null {
  const [progress, setProgress] = useState<NativeProgress | null>(null);

  useEffect(() => {
    setProgress(null);
    if (!jobId || !nativeApi.app.isTauri()) return;

    let active = true;
    let unlisten: (() => void) | undefined;
    void nativeApi.disk.onScanProgress((event) => {
      if (active && event.jobId === jobId) setProgress(event);
    }).then((stop) => {
      if (active) unlisten = stop;
      else stop();
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, [jobId]);

  return progress;
}
