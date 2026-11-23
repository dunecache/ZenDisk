/**
 * Mirrors Zustand preferences into the Tauri store in the installed app.
 * The local persist middleware stays the read path, so the browser preview and
 * first launch before hydration behave identically.
 */
import { nativeApi } from "@/lib/native/client";
import { preferencesFromStorage, usePreferencesStore } from "./usePreferencesStore";

let started = false;

export function startPreferencePersistence(): () => void {
  if (started || typeof window === "undefined") return () => {};
  started = true;

  let saving = false;
  let pending = false;

  const save = async () => {
    if (saving) {
      pending = true;
      return;
    }
    saving = true;
    try {
      do {
        pending = false;
        const values: Record<string, unknown> = { ...preferencesFromStorage(usePreferencesStore.getState()) };
        await nativeApi.settings.preferences.save(values);
      } while (pending);
    } catch {
      // The local store still holds the values; next change retries the mirror.
    } finally {
      saving = false;
    }
  };

  const unsubscribe = usePreferencesStore.subscribe(save);

  void nativeApi.settings.preferences.load().then((stored) => {
    if (Object.keys(stored).length === 0) return;
    usePreferencesStore.setState((state) => {
      const next = { ...state };
      for (const key of Object.keys(stored) as (keyof typeof state)[]) {
        if (key in state && typeof stored[key] === typeof state[key]) {
          Object.assign(next, { [key]: stored[key] });
        }
      }
      return next;
    });
  }).catch(() => {});

  return () => {
    unsubscribe();
    started = false;
  };
}
