import { useQuery } from "@tanstack/react-query";
import { fetchMaintenance } from "@/lib/native/mock-maintenance";

export const maintenanceKeys = { all: ["maintenance"] as const };

/** Swap `fetchMaintenance` for a nativeApi maintenance bundle when ready. */
export function useMaintenance() {
  return useQuery({
    queryKey: maintenanceKeys.all,
    queryFn: fetchMaintenance,
    staleTime: 30_000,
  });
}
