/**
 * Demo data for the Automation screen. Isolated here so swapping to native
 * Task Scheduler commands is a one-line change in `hooks/data/useAutomation.ts`.
 * Never import this from features directly.
 */
import type { AutomationData } from "@/types";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
const hoursAhead = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();

export const automationData: AutomationData = {
  access: "granted",
  collectedAt: hoursAgo(1),
  tasks: [
    {
      id: "t1",
      name: "Weekly temp cleanup",
      action: "cleanup",
      schedule: "Weekly · Sundays 03:00",
      target: "C: / Users/me/AppData/Local/Temp",
      conditions: ["Files older than 7 days", "Skip system folders"],
      enabled: true,
      lastRunAt: hoursAgo(72),
      nextRunAt: hoursAhead(51),
      notifications: true,
      execution: "quarantine",
      source: "Windows Task Scheduler (demo data)",
    },
    {
      id: "t2",
      name: "Monthly photo organization",
      action: "organize",
      schedule: "Monthly · 1st 09:00",
      target: "D: / Photos/Inbox",
      conditions: ["File type is image", "Exclude folders with .zendisk-ignore"],
      enabled: true,
      lastRunAt: hoursAgo(720),
      nextRunAt: hoursAhead(240),
      notifications: false,
      execution: "quarantine",
      source: "Windows Task Scheduler (demo data)",
    },
    {
      id: "t3",
      name: "Daily duplicate scan",
      action: "duplicates",
      schedule: "Daily · 02:30",
      target: "D: / shared",
      conditions: ["Minimum size 1 MB", "Minimum similarity 95%"],
      enabled: false,
      lastRunAt: hoursAgo(26),
      notifications: true,
      execution: "quarantine",
      source: "Windows Task Scheduler (demo data)",
    },
    {
      id: "t4",
      name: "Drive health snapshot",
      action: "health",
      schedule: "Weekly · Mondays 08:00",
      target: "All fixed drives",
      conditions: ["Report only supported attributes"],
      enabled: true,
      lastRunAt: hoursAgo(168),
      nextRunAt: hoursAhead(120),
      notifications: false,
      execution: "report",
      source: "Windows Task Scheduler (demo data)",
    },
  ],
  runs: [
    {
      id: "r1",
      taskId: "t1",
      taskName: "Weekly temp cleanup",
      startedAt: hoursAgo(72),
      durationMs: 42_000,
      result: "success",
      filesProcessed: 412,
      quarantined: 412,
      errors: [],
    },
    {
      id: "r2",
      taskId: "t3",
      taskName: "Daily duplicate scan",
      startedAt: hoursAgo(26),
      durationMs: 318_000,
      result: "partial",
      filesProcessed: 1840,
      quarantined: 96,
      errors: ["3 folders were skipped: access denied"],
    },
    {
      id: "r3",
      taskId: "t2",
      taskName: "Monthly photo organization",
      startedAt: hoursAgo(720),
      durationMs: 96_000,
      result: "success",
      filesProcessed: 231,
      quarantined: 0,
      errors: [],
    },
    {
      id: "r4",
      taskId: "t4",
      taskName: "Drive health snapshot",
      startedAt: hoursAgo(168),
      durationMs: 12_000,
      result: "failed",
      filesProcessed: 0,
      quarantined: 0,
      errors: ["SMART data was not available for drive D:"],
    },
    {
      id: "r5",
      taskId: "t1",
      taskName: "Weekly temp cleanup",
      startedAt: hoursAgo(336),
      durationMs: 38_000,
      result: "cancelled",
      filesProcessed: 120,
      quarantined: 120,
      errors: ["Cancelled by user"],
    },
  ],
};

/** Simulated async fetch so loading/skeleton states are exercised in dev. */
export function fetchAutomation(): Promise<AutomationData> {
  return new Promise((resolve) => setTimeout(() => resolve(automationData), 300));
}
