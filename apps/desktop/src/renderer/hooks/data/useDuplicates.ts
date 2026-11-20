import { useQuery } from "@tanstack/react-query";
import { fetchDuplicates } from "@/lib/native/mock-duplicates";

export const duplicatesKeys = { all: ["duplicates"] as const };

/** Swap `fetchDuplicates` for nativeApi.duplicates.scan() when ready. */
export function useDuplicates() {
  return useQuery({
    queryKey: duplicatesKeys.all,
    queryFn: fetchDuplicates,
    staleTime: 30_000,
  });
}
