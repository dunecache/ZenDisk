import { cn } from "@/lib/utils";

/** Placeholder background-operation record; real state lands with TaskStore. */
export interface BackgroundTask {
  id: string;
  label: string;
  progress?: number;
}

export interface StatusBarProps {
  tasks?: BackgroundTask[];
  activeScans?: number;
  selectedDrive?: string;
  version?: string;
  className?: string;
}

/** Optional, non-dominant bottom strip: background work, scans, drive, version. */
export function StatusBar({
  tasks = [],
  activeScans = 0,
  selectedDrive,
  version = "0.0.0",
  className,
}: StatusBarProps) {
  return (
    <footer
      className={cn(
        "flex h-7 shrink-0 items-center justify-between gap-[var(--space-4)] border-t border-border bg-surface px-[var(--page-padding)] text-[length:var(--text-caption)] text-muted",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-[var(--space-4)]">
        {tasks.map((task) => (
          <span key={task.id} className="flex items-center gap-[var(--space-2)] truncate">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            {task.label}
            {task.progress !== undefined && ` ${Math.round(task.progress)}%`}
          </span>
        ))}
        {tasks.length === 0 && <span>Ready</span>}
        {activeScans > 0 && (
          <span>
            {activeScans} {activeScans === 1 ? "scan" : "scans"} active
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-[var(--space-4)]">
        {selectedDrive && <span className="text-mono">{selectedDrive}</span>}
        <span className="text-mono">v{version}</span>
      </div>
    </footer>
  );
}
