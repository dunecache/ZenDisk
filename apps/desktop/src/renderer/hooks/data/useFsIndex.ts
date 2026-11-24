import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toNativeRoot } from "@/lib/native/adapters";
import {
  nativeApi,
  type NativeIndexProgress,
  type NativeIndexStatus,
  type NativeIndexStats,
} from "@/lib/native/client";

export const indexKeys = {
  all: ["fs-index"] as const,
  status: (root: string) => ["fs-index", "status", root] as const,
  stats: (root: string) => ["fs-index", "stats", root] as const,
};

/**
 * Aggregated status for the persistent filesystem index. The renderer never
 * holds the index itself — only counters returned by Rust.
 */
export function useFsIndex(driveId: string) {
  const root = toNativeRoot(driveId);
  const enabled = Boolean(driveId) && nativeApi.app.isTauri();
  const [progress, setProgress] = useState<NativeIndexProgress | null>(null);

  useEffect(() => {
    setProgress(null);
    if (!enabled) return;
    let active = true;
    let unlisten: (() => void) | undefined;
    void nativeApi.index.onProgress((event) => {
      if (active && event.root === root) setProgress(event);
    }).then((stop) => {
      if (active) unlisten = stop;
      else stop();
    });
    return () => {
      active = false;
      unlisten?.();
    };
  }, [enabled, root]);

  const status = useQuery<NativeIndexStatus | null>({
    queryKey: indexKeys.status(root),
    queryFn: () => nativeApi.index.status(root),
    enabled,
    staleTime: 10_000,
  });
  const stats = useQuery<NativeIndexStats>({
    queryKey: indexKeys.stats(root),
    queryFn: () => nativeApi.index.stats(root),
    enabled,
    staleTime: 10_000,
  });

  const refresh = useCallback(() => {
    void status.refetch();
    void stats.refetch();
  }, [status, stats]);

  const rescan = useCallback(
    async (force = false) => {
      if (!enabled) return;
      const jobId = `idx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      await nativeApi.index.discover(root, jobId, force);
      await nativeApi.index.process(root, 200);
      refresh();
    },
    [enabled, root, refresh],
  );

  const reconcile = useCallback(async () => {
    if (!enabled) return;
    await nativeApi.index.reconcile(root);
    refresh();
  }, [enabled, root, refresh]);

  return {
    status: status.data ?? null,
    stats: stats.data ?? null,
    progress,
    rescan,
    reconcile,
    refresh,
    isLoading: status.isLoading,
  };
}
