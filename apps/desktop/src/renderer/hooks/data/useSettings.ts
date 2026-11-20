import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/lib/native/mock-settings";

export const settingsKeys = { all: ["settings"] as const };

/** Swap `fetchSettings` for native preference storage when ready. */
export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: fetchSettings,
    staleTime: 30_000,
  });
}
