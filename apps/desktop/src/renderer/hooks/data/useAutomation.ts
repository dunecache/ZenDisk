import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyTaskChange,
  fetchAutomation,
  type AutomationTaskChange,
} from "@/lib/native/mock-automation";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";

export const automationKeys = { all: ["automation"] as const };

/** Native task list with mock fallback for the browser preview. */
export function useAutomation() {
  return useQuery({
    queryKey: automationKeys.all,
    queryFn: () => withFallback(() => nativeApi.automation.list(), fetchAutomation),
    staleTime: 30_000,
  });
}

/** Preview-only task edits; native changes land with the Task Scheduler command. */
export function useAutomationActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (change: AutomationTaskChange) => {
      if (!nativeApi.app.isTauri()) {
        applyTaskChange(change);
        return;
      }
      if (change.type === "toggle") {
        const applied = await nativeApi.automation.set(change.id, change.enabled);
        if (!applied) {
          // The native command reports unsupported: keep the preview honest.
          applyTaskChange(change);
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: automationKeys.all }),
  });
}
