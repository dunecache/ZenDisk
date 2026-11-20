/**
 * Demo data for the Reports screen. Isolated here so swapping to aggregated
 * native history is a one-line change in `hooks/data/useReports.ts`.
 * Never import this from features directly.
 */
import { mockAccess } from "./mock-access";
import type { ReportsData, StoragePoint } from "@/types";

const GB = 1024 ** 3;
const day = 86_400_000;

const storage: StoragePoint[] = Array.from({ length: 90 }, (_, index) => {
  const date = new Date(Date.now() - (89 - index) * day).toISOString();
  const usedBytes = 192 * GB + index * 0.42 * GB + Math.sin(index / 6) * 2.4 * GB;
  const freeBytes = 320 * GB - index * 0.42 * GB - Math.sin(index / 6) * 2.4 * GB;
  return { date, usedBytes, freeBytes };
});

export const reportsData: ReportsData = {
  access: mockAccess(),
  collectedAt: new Date().toISOString(),
  metrics: {
    "7": {
      recoveredBytes: 0.8 * GB,
      recoveredDelta: 12,
      duplicatesBytes: 0.3 * GB,
      duplicatesDelta: -4,
      organizedFiles: 42,
      organizedDelta: 8,
    },
    "30": {
      recoveredBytes: 4.6 * GB,
      recoveredDelta: 18,
      duplicatesBytes: 1.9 * GB,
      duplicatesDelta: -11,
      organizedFiles: 218,
      organizedDelta: 14,
    },
    "90": {
      recoveredBytes: 12.3 * GB,
      recoveredDelta: 24,
      duplicatesBytes: 5.1 * GB,
      duplicatesDelta: -19,
      organizedFiles: 704,
      organizedDelta: 22,
    },
  },
  storage,
  activity: [
    {
      id: "ra1",
      kind: "cleanup",
      title: "Cleanup completed",
      detail: "2.1 GB reclaimed from temporary files",
      at: new Date(Date.now() - 2 * day).toISOString(),
    },
    {
      id: "ra2",
      kind: "duplicates",
      title: "Duplicate scan finished",
      detail: "96 files quarantined, 0 permanently deleted",
      at: new Date(Date.now() - 6 * day).toISOString(),
    },
    {
      id: "ra3",
      kind: "organize",
      title: "Organization rule applied",
      detail: "218 photos moved into dated folders",
      at: new Date(Date.now() - 14 * day).toISOString(),
    },
    {
      id: "ra4",
      kind: "scan",
      title: "Disk analysis finished",
      detail: "Drive C: scanned — 84,192 items",
      at: new Date(Date.now() - 21 * day).toISOString(),
    },
    {
      id: "ra5",
      kind: "maintenance",
      title: "Startup review completed",
      detail: "6 entries reviewed — no changes made",
      at: new Date(Date.now() - 28 * day).toISOString(),
    },
  ],
  recommendations: [
    {
      id: "rr1",
      title: "Review temporary files",
      evidence: "Temporary files make up 2.1 GB on C:.",
      route: "/cleanup",
      potentialBytes: 2.1 * GB,
    },
    {
      id: "rr2",
      title: "Review duplicate photos",
      evidence: "96 duplicate images were found under D:/Photos.",
      route: "/duplicates",
      potentialBytes: 1.4 * GB,
    },
  ],
};

/** Simulated async fetch so loading/skeleton states are exercised in dev. */
export function fetchReports(): Promise<ReportsData> {
  return new Promise((resolve) => setTimeout(() => resolve(reportsData), 300));
}
