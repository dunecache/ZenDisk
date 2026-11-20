import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/layout";

export interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  icon?: ReactNode;
  className?: string;
}

const trendClass = {
  up: "text-success",
  down: "text-danger",
  neutral: "text-muted",
} as const;

export function MetricCard({
  label,
  value,
  unit,
  description,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("flex flex-col gap-[var(--space-2)]", className)}>
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <span className="text-[length:var(--text-small)] text-muted">{label}</span>
        {icon && <span className="text-muted" aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-[var(--space-2)]">
        <strong className="text-[length:var(--text-metric)] font-semibold tabular-nums">
          {value}
        </strong>
        {unit && <span className="text-[length:var(--text-body)] text-muted">{unit}</span>}
      </div>
      {description && (
        <span className="text-[length:var(--text-small)] text-muted">{description}</span>
      )}
      {trend && (
        <span className={cn("text-[length:var(--text-small)]", trendClass[trend.direction])}>
          {trend.value}
        </span>
      )}
    </Card>
  );
}
