import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/navigation";
import { useGlobalShortcuts } from "@/hooks";
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
  // Navigation shortcuts (Ctrl+1/2/,) are active now; search/refresh/delete
  // handlers are supplied by features as they land. Escape is handled natively
  // by Radix dialogs and menus.
  useGlobalShortcuts();

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
    </div>
  );
}
