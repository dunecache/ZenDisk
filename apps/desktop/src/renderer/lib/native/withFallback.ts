import { isTauri } from "@tauri-apps/api/core";

/**
 * Phase 6 queries call native commands first. In the browser preview there is
 * no IPC, so fall back to the isolated mock payloads rather than failing.
 */
export async function withFallback<T>(
  native: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  if (!isTauri()) return fallback();
  try {
    return await native();
  } catch {
    return fallback();
  }
}
