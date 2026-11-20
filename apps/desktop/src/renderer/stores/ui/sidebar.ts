import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SIDEBAR_WIDTH = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 64;

export interface SidebarState {
  collapsed: boolean;
  width: number;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setWidth: (width: number) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      width: SIDEBAR_WIDTH,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setWidth: (width) =>
        set({
          width: Math.max(SIDEBAR_WIDTH_COLLAPSED, Math.min(320, width)),
        }),
    }),
    {
      name: "zendisk-sidebar",
      version: 1,
      partialize: (state) => ({
        collapsed: state.collapsed,
        width: state.width,
      }),
    },
  ),
);
