import { cn } from "@/lib/utils";

export type ProgressState = "default" | "success" | "warning" | "danger";

const fillClass: Record<ProgressState, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export interface ProgressBarProps {
  value?: number;
  max?: number;
  state?: ProgressState;
  label?: string;
  /** Show a percentage caption beside the bar. */
  showLabel?: boolean;
  /** Indeterminate work — clearly distinct from measurable progress. */
  indeterminate?: boolean;
  className?: string;
}

export function ProgressBar({
  value = 0,
  max = 100,
  state = "default",
  label,
  showLabel = false,
  indeterminate = false,
  className,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const stateLabel = label ? `${label}: ` : "";

  return (
    <div className={cn("flex flex-col gap-[var(--space-1)]", className)}>
      {(label || showLabel) && (
        <div className="flex items-center justify-between text-[length:var(--text-small)]">
          {label && <span className="text-muted">{label}</span>}
          {showLabel && (
            <span className="tabular-nums text-foreground">
              {indeterminate ? "Working..." : `${Math.round(percent)}%`}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? "Progress"}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : Math.round(percent)}
        className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary"
      >
        {indeterminate ? (
          <div
            className={cn("h-full w-1/3 animate-pulse rounded-full", fillClass[state])}
          />
        ) : (
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-[var(--duration-panel)] ease-out",
              fillClass[state],
            )}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      {!label && showLabel && (
        <span className="sr-only">{`${stateLabel}${Math.round(percent)}%`}</span>
      )}
    </div>
  );
}
