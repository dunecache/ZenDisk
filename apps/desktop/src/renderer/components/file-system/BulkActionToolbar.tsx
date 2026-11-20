import type { ReactNode } from "react";
import { Button, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface BulkActionToolbarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
  className?: string;
}

/** Contextual action bar shown when files are selected. */
export function BulkActionToolbar({
  count,
  onClear,
  children,
  className,
}: BulkActionToolbarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className={cn(
        "flex items-center gap-[var(--space-2)] rounded-[var(--radius-md)] border border-border bg-surface-secondary px-[var(--space-3)] py-[var(--space-2)]",
        className,
      )}
    >
      <span className="text-[length:var(--text-body)] font-medium tabular-nums">
        {count} selected
      </span>
      <Separator orientation="vertical" className="h-5" />
      {children}
      <Button variant="ghost" size="sm" className="ml-auto" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
