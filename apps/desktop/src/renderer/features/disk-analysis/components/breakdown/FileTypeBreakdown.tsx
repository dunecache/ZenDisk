import { Card } from "@/components/layout";
import { FileSize } from "@/components/data-display";
import type { FileTypeStat } from "@/types";

export interface FileTypeBreakdownProps {
  stats: FileTypeStat[];
  totalBytes: number;
}

export function FileTypeBreakdown({ stats, totalBytes }: FileTypeBreakdownProps) {
  return (
    <Card className="flex flex-col gap-[var(--space-3)]">
      <h3 className="text-[length:var(--text-h3)] font-semibold">File types</h3>
      <ul className="flex flex-col gap-[var(--space-3)]">
        {stats.map((stat) => {
          const percent = totalBytes > 0 ? (stat.bytes / totalBytes) * 100 : 0;
          return (
            <li key={stat.category} className="flex flex-col gap-[var(--space-1)]">
              <div className="flex items-center justify-between text-[length:var(--text-small)]">
                <span className="flex items-center gap-[var(--space-2)]">
                  <span aria-hidden="true" className="h-2 w-2 rounded-xs" style={{ backgroundColor: stat.color }} />
                  {stat.category}
                </span>
                <span className="tabular-nums text-muted"><FileSize bytes={stat.bytes} /></span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-surface-tertiary">
                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: stat.color }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
