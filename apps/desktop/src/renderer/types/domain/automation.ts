export type AutomationAction = "cleanup" | "organize" | "duplicates" | "health";
export type AutomationResult = "success" | "partial" | "failed" | "cancelled";
export type AutomationAccess = "granted" | "denied";
export type AutomationExecution = "quarantine" | "report";

export interface AutomationTask {
  id: string;
  name: string;
  action: AutomationAction;
  schedule: string;
  target: string;
  conditions: string[];
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  notifications: boolean;
  /** Scheduled actions never permanently delete — see Spec.md rule 7. */
  execution: AutomationExecution;
  source: string;
}

export interface AutomationRun {
  id: string;
  taskId: string;
  taskName: string;
  startedAt: string;
  durationMs: number;
  result: AutomationResult;
  filesProcessed: number;
  quarantined: number;
  errors: string[];
}

export interface AutomationData {
  access: AutomationAccess;
  tasks: AutomationTask[];
  runs: AutomationRun[];
  collectedAt: string;
}
