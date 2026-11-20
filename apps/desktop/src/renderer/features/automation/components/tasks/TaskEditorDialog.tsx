import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@/components/ui";
import { InlineAlert } from "@/components/data-display";
import type {
  AutomationAction,
  AutomationExecution,
  AutomationTask,
} from "@/types";

export interface TaskEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null creates a new task. */
  task: AutomationTask | null;
  onSave: (task: AutomationTask) => void;
}

interface FormState {
  name: string;
  action: AutomationAction;
  schedule: string;
  target: string;
  conditions: string;
  notifications: boolean;
  execution: AutomationExecution;
}

const emptyForm: FormState = {
  name: "",
  action: "cleanup",
  schedule: "Daily · 02:00",
  target: "",
  conditions: "",
  notifications: true,
  execution: "quarantine",
};

export function TaskEditorDialog({
  open,
  onOpenChange,
  task,
  onSave,
}: TaskEditorDialogProps) {
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      task
        ? {
            name: task.name,
            action: task.action,
            schedule: task.schedule,
            target: task.target,
            conditions: task.conditions.join(", "),
            notifications: task.notifications,
            execution: task.execution,
          }
        : emptyForm,
    );
  }, [open, task]);

  const valid = form.name.trim().length > 0 && form.target.trim().length > 0;

  const save = () => {
    if (!valid) return;
    onSave({
      id: task?.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      action: form.action,
      schedule: form.schedule,
      target: form.target.trim(),
      conditions: form.conditions
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      enabled: task?.enabled ?? true,
      lastRunAt: task?.lastRunAt,
      nextRunAt: task?.nextRunAt,
      notifications: form.notifications,
      execution: form.execution,
      source: task?.source ?? "Windows Task Scheduler (demo data)",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New scheduled task"}</DialogTitle>
          <DialogDescription>
            Configure what runs, where it runs, and when. Changes are stored in
            the preview until native access is connected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-2)]">
            <label htmlFor="automation-task-name" className="text-[length:var(--text-small)] text-muted">
              Task name
            </label>
            <Input
              id="automation-task-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Weekly temp cleanup"
            />
          </div>

          <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
            <div className="flex flex-col gap-[var(--space-2)]">
              <label htmlFor="automation-task-action" className="text-[length:var(--text-small)] text-muted">
                Action
              </label>
              <Select
                value={form.action}
                onValueChange={(value) => setForm({ ...form, action: value as AutomationAction })}
              >
                <SelectTrigger id="automation-task-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleanup">Cleanup</SelectItem>
                  <SelectItem value="organize">Organize</SelectItem>
                  <SelectItem value="duplicates">Duplicate scan</SelectItem>
                  <SelectItem value="health">Health snapshot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-[var(--space-2)]">
              <label htmlFor="automation-task-schedule" className="text-[length:var(--text-small)] text-muted">
                Frequency
              </label>
              <Input
                id="automation-task-schedule"
                value={form.schedule}
                onChange={(event) => setForm({ ...form, schedule: event.target.value })}
                placeholder="Daily · 02:00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-[var(--space-2)]">
            <label htmlFor="automation-task-target" className="text-[length:var(--text-small)] text-muted">
              Target drives and directories
            </label>
            <Input
              id="automation-task-target"
              className="text-mono"
              value={form.target}
              onChange={(event) => setForm({ ...form, target: event.target.value })}
              placeholder="C: / Users/me/Downloads"
            />
          </div>

          <div className="flex flex-col gap-[var(--space-2)]">
            <label htmlFor="automation-task-conditions" className="text-[length:var(--text-small)] text-muted">
              Conditions (comma separated)
            </label>
            <Input
              id="automation-task-conditions"
              value={form.conditions}
              onChange={(event) => setForm({ ...form, conditions: event.target.value })}
              placeholder="Files older than 7 days, Skip system folders"
            />
          </div>

          <div className="flex flex-col gap-[var(--space-2)]">
            <label htmlFor="automation-task-execution" className="text-[length:var(--text-small)] text-muted">
              Execution behavior
            </label>
            <Select
              value={form.execution}
              onValueChange={(value) => setForm({ ...form, execution: value as AutomationExecution })}
            >
              <SelectTrigger id="automation-task-execution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarantine">Quarantine matches only</SelectItem>
                <SelectItem value="report">Report only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-[var(--space-3)]">
            <label htmlFor="automation-task-notifications" className="text-[length:var(--text-body)]">
              Notify me when the task finishes
            </label>
            <Switch
              id="automation-task-notifications"
              checked={form.notifications}
              onCheckedChange={(checked) => setForm({ ...form, notifications: checked })}
            />
          </div>

          <InlineAlert variant="info" title="Recovery first">
            Scheduled actions can only quarantine files or produce a report. They
            never permanently delete, and every run is written to history.
          </InlineAlert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={save}>
            {task ? "Save changes" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
