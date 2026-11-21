import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/lib/native/mock-settings";
import { nativeApi } from "@/lib/native/client";
import { withFallback } from "@/lib/native/withFallback";

export const settingsKeys = { all: ["settings"] as const };

/** Native settings metadata with mock fallback for the browser preview. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: () => withFallback(() => nativeApi.settings.read(), fetchSettings),
    staleTime: 30_000,
  });
}
