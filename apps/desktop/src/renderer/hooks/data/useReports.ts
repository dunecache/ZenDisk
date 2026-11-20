import { useQuery } from "@tanstack/react-query";
import { fetchReports } from "@/lib/native/mock-reports";

export const reportsKeys = { all: ["reports"] as const };

/** Swap `fetchReports` for native aggregation when ready. */
export function useReports() {
  return useQuery({
    queryKey: reportsKeys.all,
    queryFn: fetchReports,
    staleTime: 30_000,
  });
}
