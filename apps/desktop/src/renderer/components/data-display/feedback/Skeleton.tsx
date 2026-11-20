import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Match the dimensions of the real component it stands in for. */
  width?: string;
  height?: string;
  circle?: boolean;
}

export function Skeleton({
  className,
  width,
  height,
  circle = false,
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={cn(
        "animate-pulse bg-surface-tertiary",
        circle ? "rounded-full" : "rounded-[var(--radius-sm)]",
        className,
      )}
    />
  );
}

/** A skeleton shaped like a card, for dashboard loading states. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-border bg-surface p-[var(--space-5)]", className)}>
      <Skeleton width="40%" height="12px" />
      <Skeleton width="60%" height="28px" />
      <Skeleton width="80%" height="12px" />
    </div>
  );
}
