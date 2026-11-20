import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalSearchDialog, Sidebar } from "@/components/navigation";
import { useGlobalShortcuts } from "@/hooks";
import { ToastViewport } from "@/components/data-display";
import { useSidebarStore } from "@/stores";
import { StatusBar } from "./StatusBar";
import type { BackgroundTask } from "./StatusBar";

export interface AppShellProps {
  /** Background operations shown in the status bar. */
  tasks?: BackgroundTask[];
  activeScans?: number;
  selectedDrive?: string;
  version?: string;
}

/**
 * Root desktop layout: sidebar + independently scrolling main content +
 * optional status bar. Radix dialogs/toasts portal to document.body; their
 * hosts are rendered by providers/screens.
 */
export function AppShell({
  tasks,
  activeScans,
  selectedDrive,
  version,
}: AppShellProps) {
  const queryClient = useQueryClient();
  const [searchOpen, setSearchOpen] = useState(false);
  const setCollapsed = useSidebarStore((state) => state.setCollapsed);
  const wasNarrow = useRef(false);

  // Desktop-first: below 1100px the rail collapses to preserve content width.
  useEffect(() => {
    const onResize = () => {
      const narrow = window.innerWidth < 1100;
      if (narrow !== wasNarrow.current) {
        wasNarrow.current = narrow;
        setCollapsed(narrow);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setCollapsed]);

  const focusViewSearch = () => {
    const input = document.querySelector<HTMLInputElement>('main input[type="search"]');
    if (!input) return;
    input.focus();
    input.select();
  };

  // Escape is handled natively by Radix dialogs and menus. Delete dispatches a
  // contextual event that destructive views can register against.
  useGlobalShortcuts({
    onGlobalSearch: () => setSearchOpen(true),
    onViewSearch: focusViewSearch,
    onRefresh: () => void queryClient.invalidateQueries(),
    onDelete: () => window.dispatchEvent(new CustomEvent("zendisk:delete")),
  });

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <StatusBar
          tasks={tasks}
          activeScans={activeScans}
          selectedDrive={selectedDrive}
          version={version}
        />
      </div>
      <ToastViewport />
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
