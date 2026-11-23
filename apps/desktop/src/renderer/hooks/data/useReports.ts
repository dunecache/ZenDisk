import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import {
  driveInfoFromNative,
  reportsDataFromOperations,
} from "@/lib/native/adapters";
import { fetchReports } from "@/lib/native/mock-reports";
import type { ReportsData } from "@/types";

export const reportsKeys = { all: ["reports"] as const };

/** Aggregates real operation history; no storage snapshots are fabricated. */
export function useReports() {
  return useQuery({
    queryKey: reportsKeys.all,
    queryFn: () =>
      withFallback<ReportsData>(
        async () => {
          const [records, disks] = await Promise.all([
            nativeApi.reports.summary(),
            nativeApi.disk.list(),
          ]);
          return reportsDataFromOperations(records, disks.map(driveInfoFromNative));
        },
        fetchReports,
      ),
    staleTime: 30_000,
  });
}
