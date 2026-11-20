import type { ActivityEvent, Recommendation } from "./storage";

export type ReportRange = "7" | "30" | "90";
export type ReportAccess = "granted" | "denied";

export interface ReportMetrics {
  recoveredBytes: number;
  recoveredDelta: number;
  duplicatesBytes: number;
  duplicatesDelta: number;
  organizedFiles: number;
  organizedDelta: number;
}

export interface StoragePoint {
  date: string;
  usedBytes: number;
  freeBytes: number;
}

export interface ReportsData {
  access: ReportAccess;
  collectedAt: string;
  metrics: Record<ReportRange, ReportMetrics>;
  storage: StoragePoint[];
  activity: ActivityEvent[];
  recommendations: Recommendation[];
}
