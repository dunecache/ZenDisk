import { cva, type VariantProps } from "class-variance-authority";
import { CircleCheck, CircleX, CirclePause, LoaderCircle, OctagonAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type Status =
  | "healthy"
  | "warning"
  | "critical"
  | "running"
  | "completed"
  | "failed"
  | "paused";

const statusVariants = cva(
  "inline-flex items-center gap-[var(--space-2)] rounded-[var(--radius-full)] border px-[var(--space-2)] py-0.5 text-[length:var(--text-caption)] font-medium",
  {
    variants: {
      status: {
        healthy: "border-success/30 bg-success/10 text-success",
        completed: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        critical: "border-danger/30 bg-danger/10 text-danger",
        failed: "border-danger/30 bg-danger/10 text-danger",
        running: "border-info/30 bg-info/10 text-info",
        paused: "border-border bg-muted-background text-muted",
      },
    },
    defaultVariants: { status: "healthy" },
  },
);

/** Status is conveyed by icon + label, never by color alone. */
const icons = {
  healthy: CircleCheck,
  completed: CircleCheck,
  warning: TriangleAlert,
  critical: OctagonAlert,
  failed: CircleX,
  running: LoaderCircle,
  paused: CirclePause,
} as const;

const labels: Record<Status, string> = {
  healthy: "Healthy",
  warning: "Warning",
  critical: "Critical",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  paused: "Paused",
};

export interface StatusBadgeProps extends VariantProps<typeof statusVariants> {
  label?: string;
  className?: string;
}

export function StatusBadge({ status = "healthy", label, className }: StatusBadgeProps) {
  const key = (status ?? "healthy") as Status;
  const Icon = icons[key];
  return (
    <span className={cn(statusVariants({ status }), className)}>
      <Icon
        size={12}
        className={key === "running" ? "animate-spin" : undefined}
        aria-hidden="true"
      />
      {label ?? labels[key]}
    </span>
  );
}
