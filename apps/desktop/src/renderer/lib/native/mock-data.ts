/**
 * Typed demo data for UI development. Isolated here so swapping to real
 * native operations is a one-line change in each query hook (hooks/data).
 * Never import this from features directly.
 */
import type { OverviewData } from "@/types";

const GB = 1024 ** 3;

export const overviewData: OverviewData = {
  drives: [
    {
      id: "C:",
      name: "System",
      letter: "C:",
      type: "SSD",
      filesystem: "NTFS",
      capacity: 512 * GB,
      free: 186 * GB,
    },
    {
      id: "D:",
      name: "Storage",
      letter: "D:",
      type: "HDD",
      filesystem: "NTFS",
      capacity: 2 * 1024 * GB,
      free: 446 * GB,
    },
  ],
  activity: [
    {
      id: "a1",
      kind: "cleanup",
      title: "Cleanup completed",
      detail: "2.1 GB reclaimed from temporary files",
      at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    },
    {
      id: "a2",
      kind: "scan",
      title: "Disk analysis finished",
      detail: "Drive C: scanned — 84,192 items",
      at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "a3",
      kind: "duplicates",
      title: "Duplicates found",
      detail: "1.4 GB in 23 duplicate groups",
      at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
  ],
  recommendations: [
    {
      id: "r1",
      title: "Review temporary files",
      evidence: "Temporary files account for 3.4 GB on drive C:.",
      route: "/cleanup",
      potentialBytes: 3.4 * GB,
    },
    {
      id: "r2",
      title: "Check duplicate photos",
      evidence: "23 groups of identical images were found across C: and D:.",
      route: "/duplicates",
      potentialBytes: 1.4 * GB,
    },
  ],
};

/** Simulated async fetch so loading/skeleton states are exercised in dev. */
export function fetchOverview(): Promise<OverviewData> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(overviewData), 250);
  });
}
