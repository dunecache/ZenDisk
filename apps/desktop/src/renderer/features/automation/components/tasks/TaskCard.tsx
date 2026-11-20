import { CalendarClock, Play } from "lucide-react";
import { DateDisplay, StatusBadge } from "@/components/data-display";
import { Card } from "@/components/layout";
import { Button, Switch } from "@/components/ui";
import type { AutomationAction, AutomationTask } from "@/types";

const actionLabel: Record<AutomationAction, string> = {
  cleanup: "Cleanup",
  organize: "Organize",
  duplicates: "Duplicate scan",
  health: "Health snapshot",
};

export interface TaskCardProps {
  task: AutomationTask;
  /** Disabled when Task Scheduler access has been denied. */
  disabled?: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (task: AutomationTask) => void;
}

export function TaskCard({ task, disabled = false, onToggle, onEdit }: TaskCardProps) {
  return (
    <Card className="flex flex-col gap-[var(--space-4)]">
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
          <h3 className="text-[length:var(--text-h3)] font-semibold">{task.name}</h3>
          <span className="text-[length:var(--text-small)] text-muted">
            {actionLabel[task.action]} · {task.execution === "quarantine" ? "Quarantine only" : "Report only"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-[var(--space-3)]">
          <StatusBadge
            status={task.enabled ? "healthy" : "paused"}
            label={task.enabled ? "Enabled" : "Disabled"}
          />
          <Switch
            checked={task.enabled}
            disabled={disabled}
            aria-label={`${task.enabled ? "Disable" : "Enable"} ${task.name}`}
            onCheckedChange={(checked) => onToggle(task.id, checked)}
          />
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-[var(--space-4)] gap-y-[var(--space-2)] text-[length:var(--text-body)]">
        <dt className="text-muted">Schedule</dt>
        <dd className="flex items-center gap-[var(--space-2)]">
          <CalendarClock size={16} className="text-muted" aria-hidden="true" />
          {task.schedule}
        </dd>
        <dt className="text-muted">Target</dt>
        <dd className="text-mono break-all">{task.target}</dd>
        <dt className="text-muted">Last run</dt>
        <dd>{task.lastRunAt ? <DateDisplay value={task.lastRunAt} /> : "Never"}</dd>
        <dt className="text-muted">Conditions</dt>
        <dd>{task.conditions.length ? task.conditions.join(" · ") : "None"}</dd>
      </dl>

      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)] border-t border-border pt-[var(--space-3)]">
        <span className="text-[length:var(--text-small)] text-muted">
          {task.notifications ? "Notifications on" : "Notifications off"} ·{" "}
          {task.source}
        </span>
        <div className="flex gap-[var(--space-2)]">
          <Button variant="outline" size="sm" disabled onClick={() => undefined}>
            <Play size={14} aria-hidden="true" />
            Run now
          </Button>
          <Button variant="secondary" size="sm" disabled={disabled} onClick={() => onEdit(task)}>
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );
}
