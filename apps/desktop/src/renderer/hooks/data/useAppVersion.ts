import { useQuery } from "@tanstack/react-query";
import { nativeApi } from "@/lib/native/client";

export const appVersionKeys = {
  all: ["app", "version"] as const,
};

/**
 * Real Tauri application version, used by the status bar. In `pnpm dev:web`
 * there is no Tauri IPC, so consumers fall back to "0.0.0".
 */
export function useAppVersion() {
  return useQuery({
    queryKey: appVersionKeys.all,
    queryFn: () => nativeApi.app.version(),
    staleTime: Infinity,
    retry: false,
  });
}
