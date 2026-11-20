import { useQuery } from "@tanstack/react-query";
import { fetchAutomation } from "@/lib/native/mock-automation";

export const automationKeys = { all: ["automation"] as const };

/** Swap `fetchAutomation` for nativeApi automation commands when ready. */
export function useAutomation() {
  return useQuery({
    queryKey: automationKeys.all,
    queryFn: fetchAutomation,
    staleTime: 30_000,
  });
}
