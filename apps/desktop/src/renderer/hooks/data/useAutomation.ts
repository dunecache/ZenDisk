import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyTaskChange,
  fetchAutomation,
  type AutomationTaskChange,
} from "@/lib/native/mock-automation";

export const automationKeys = { all: ["automation"] as const };

/** Swap `fetchAutomation` for nativeApi automation commands when ready. */
export function useAutomation() {
  return useQuery({
    queryKey: automationKeys.all,
    queryFn: fetchAutomation,
    staleTime: 30_000,
  });
}

/**
 * Preview-only task edits: mutate the mock, then invalidate the query so the
 * cache remains the single source of application data.
 */
export function useAutomationActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: AutomationTaskChange) => {
      applyTaskChange(change);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: automationKeys.all }),
  });
}
