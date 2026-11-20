import type { Status } from "@/components/data-display/metrics/StatusBadge";
import type { ActivityEvent } from "./storage";

/** A single system resource reading. `supported: false` means no measurement exists. */
export interface ResourceMetric {
  id: string;
  label: string;
  value: number;
  max: number;
  displayValue: string;
  detail: string;
  supported: boolean;
  state?: "default" | "success" | "warning" | "danger";
}

export interface StartupEntry {
  id: string;
  name: string;
  publisher: string;
  enabled: boolean;
  impact: "high" | "medium" | "low";
  path: string;
  source: string;
}

export interface InstalledApplication {
  id: string;
  name: string;
  publisher: string;
  version: string;
  installedAt: string;
  estimatedBytes: number;
  source: string;
}

export interface DriveHealthAttribute {
  id: string;
  label: string;
  value: string;
  supported: boolean;
  note?: string;
}

export interface DriveHealth {
  driveId: string;
  name: string;
  status: Status;
  summary: string;
  source: string;
  limitations: string[];
  attributes: DriveHealthAttribute[];
}

export interface MaintenanceData {
  metrics: ResourceMetric[];
  events: ActivityEvent[];
  startup: StartupEntry[];
  applications: InstalledApplication[];
  driveHealth: DriveHealth[];
  collectedAt: string;
}
