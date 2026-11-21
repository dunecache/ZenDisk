import { useQuery } from "@tanstack/react-query";
import { fetchMaintenance, maintenanceData } from "@/lib/native/mock-maintenance";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";
import type { MaintenanceData } from "@/types";

export const maintenanceKeys = { all: ["maintenance"] as const };

/** Native metrics with mock fallback for the browser preview. */
export function useMaintenance() {
  return useQuery({
    queryKey: maintenanceKeys.all,
    queryFn: () =>
      withFallback<MaintenanceData>(
        async () => {
          const [metrics, health, startup, applications] = await Promise.all([
            nativeApi.maintenance.metrics(),
            nativeApi.maintenance.health(),
            nativeApi.maintenance.startup(),
            nativeApi.maintenance.applications(),
          ]);
          return {
            ...maintenanceData,
            metrics: metrics.map((metric) => ({ ...metric })),
            driveHealth: health,
            startup,
            applications,
          };
        },
        fetchMaintenance,
      ),
    staleTime: 30_000,
  });
}
