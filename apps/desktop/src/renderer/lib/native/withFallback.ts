import { isTauri } from "@tauri-apps/api/core";

/**
 * Phase 6 queries call native commands first. In the browser preview there is
 * no IPC, so fall back to the isolated mock payloads. In the installed app a
 * native error is surfaced to the query's error state — never replaced with a
 * mock measurement.
 */
export async function withFallback<T>(
  native: () => Promise<T>,
  fallback: () => Promise<T>,
): Promise<T> {
  if (!isTauri()) return fallback();
  return native();
}
