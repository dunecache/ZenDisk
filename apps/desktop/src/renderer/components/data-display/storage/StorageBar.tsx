import { formatBytes } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface StorageSegment {
  label: string;
  bytes: number;
  /** Any CSS color variable, e.g. "var(--chart-documents)". */
  color: string;
}

export interface StorageBarProps {
  segments: StorageSegment[];
  /** Show a legend with labels and sizes (colors are not the only cue). */
  showLegend?: boolean;
  className?: string;
}

/** Segmented representation of storage usage by category. */
export function StorageBar({ segments, showLegend = true, className }: StorageBarProps) {
  const total = segments.reduce((sum, segment) => sum + segment.bytes, 0);

  return (
    <div className={cn("flex flex-col gap-[var(--space-2)]", className)}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-[var(--radius-full)] bg-surface-tertiary">
        {total > 0 &&
          segments.map((segment) => (
            <div
              key={segment.label}
              title={`${segment.label}: ${formatBytes(segment.bytes)}`}
              style={{
                width: `${(segment.bytes / total) * 100}%`,
                backgroundColor: segment.color,
              }}
            />
          ))}
      </div>
      {showLegend && (
        <ul className="flex flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-1)]">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center gap-[var(--space-2)] text-[length:var(--text-small)] text-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-xs"
                style={{ backgroundColor: segment.color }}
              />
              <span>{segment.label}</span>
              <span className="tabular-nums">{formatBytes(segment.bytes)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
