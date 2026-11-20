import { Activity, Copy, FolderCog, Sparkles, Wrench } from "lucide-react";
import { DateDisplay, EmptyState } from "@/components/data-display";
import { Card } from "@/components/layout";
import type { ActivityEvent } from "@/types";

const icons = {
  scan: Activity,
  cleanup: Sparkles,
  organize: FolderCog,
  duplicates: Copy,
  maintenance: Wrench,
} as const;

export interface RecentActivityProps {
  events: ActivityEvent[];
}

export function RecentActivity({ events }: RecentActivityProps) {
  if (events.length === 0) {
    return <EmptyState heading="No recent activity" description="Operations will appear here as you use ZenDisk." />;
  }

  return (
    <Card className="p-0">
      <ul>
        {events.map((event) => {
          const Icon = icons[event.kind];
          return (
            <li
              key={event.id}
              className="flex items-center gap-[var(--space-3)] border-b border-border px-[var(--space-5)] py-[var(--space-3)] last:border-0"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-muted-background text-muted">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[length:var(--text-body)] font-medium">{event.title}</span>
                <span className="truncate text-[length:var(--text-small)] text-muted">{event.detail}</span>
              </span>
              <span className="shrink-0 text-[length:var(--text-small)] text-muted">
                <DateDisplay value={event.at} />
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
