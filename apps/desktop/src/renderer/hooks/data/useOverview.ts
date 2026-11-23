import { useQuery } from "@tanstack/react-query";
import { fetchOverview } from "@/lib/native/mock-data";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import {
  activityFromOperation,
  driveInfoFromNative,
  recommendationsFromData,
} from "@/lib/native/adapters";
import type { OperationRecord, OverviewData } from "@/types";

export const overviewKeys = {
  all: ["overview"] as const,
};

/** Real drives and recorded operations; mock data only in the browser preview. */
export function useOverview() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: () =>
      withFallback<OverviewData>(
        async () => {
          const disks = await nativeApi.disk.list();
          let records: OperationRecord[] = [];
          let activityUnavailable = false;
          try {
            records = await nativeApi.operations.history();
          } catch {
            // Drive data is still real and useful; degrade only the activity feed.
            activityUnavailable = true;
          }
          const drives = disks.map(driveInfoFromNative);
          return {
            drives,
            activity: records.map(activityFromOperation).slice(0, 5),
            recommendations: recommendationsFromData(drives, records),
            activityUnavailable,
          };
        },
        fetchOverview,
      ),
    staleTime: 30_000,
  });
}
