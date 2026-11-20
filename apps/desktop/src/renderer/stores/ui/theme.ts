import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode } from "@/types";

export interface ThemeState {
  /** The persisted user preference. `system` follows the OS color scheme. */
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "zendisk-theme",
      version: 1,
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
