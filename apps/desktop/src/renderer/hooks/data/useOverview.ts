import { useQuery } from "@tanstack/react-query";
import { fetchOverview } from "@/lib/native/mock-data";

export const overviewKeys = {
  all: ["overview"] as const,
};

/**
 * Overview application data.
 *
 * Mock-backed today. To switch to Native APIs, replace `fetchOverview` with
 * a `nativeApi.disk.list()`-based function — the query key and consumers stay
 * unchanged.
 */
export function useOverview() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: fetchOverview,
    staleTime: 30_000,
  });
}
