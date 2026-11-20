import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  heading: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Empty / no-results state. Avoid unnecessary decorative illustrations. */
export function EmptyState({
  icon,
  heading,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-48 flex-col items-center justify-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-dashed border-border bg-surface p-[var(--space-8)] text-center",
        className,
      )}
    >
      {icon && <span className="text-muted" aria-hidden="true">{icon}</span>}
      <div className="flex flex-col gap-[var(--space-1)]">
        <h3 className="text-[length:var(--text-h3)] font-semibold">{heading}</h3>
        {description && (
          <p className="max-w-sm text-[length:var(--text-body)] text-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
