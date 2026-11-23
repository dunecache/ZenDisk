import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import { activityFromOperation } from "@/lib/native/adapters";
import type { ActivityEvent } from "@/types";

export const operationsKeys = { all: ["operations"] as const };

/** Persisted operation history from SQLite; empty in the browser preview. */
export function useOperations() {
  return useQuery({
    queryKey: operationsKeys.all,
    queryFn: () =>
      withFallback<ActivityEvent[]>(
        async () => (await nativeApi.operations.history()).map(activityFromOperation),
        async () => [],
      ),
    staleTime: 30_000,
  });
}
