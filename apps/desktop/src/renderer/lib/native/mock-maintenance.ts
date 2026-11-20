/**
 * Demo data for the Maintenance screen. Isolated here so swapping to real
 * native operations is a one-line change in `hooks/data/useMaintenance.ts`.
 * Never import this from features directly.
 */
import type { MaintenanceData } from "@/types";

const GB = 1024 ** 3;
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

export const maintenanceData: MaintenanceData = {
  collectedAt: hoursAgo(1),
  metrics: [
    {
      id: "cpu",
      label: "CPU",
      value: 18,
      max: 100,
      displayValue: "18%",
      detail: "8 logical processors",
      supported: true,
    },
    {
      id: "memory",
      label: "Memory",
      value: 12.4,
      max: 32,
      displayValue: "12.4 GB",
      detail: "of 32 GB installed",
      supported: true,
    },
    {
      id: "disk-activity",
      label: "Disk activity",
      value: 24,
      max: 100,
      displayValue: "24%",
      detail: "6 MB/s read + write on C:",
      supported: true,
    },
    {
      id: "temperature",
      label: "Temperature",
      value: 0,
      max: 100,
      displayValue: "Not available",
      detail: "No temperature sensor is exposed for this system.",
      supported: false,
    },
  ],
  events: [
    {
      id: "m1",
      kind: "maintenance",
      title: "Startup review completed",
      detail: "6 startup entries reviewed — no changes made",
      at: hoursAgo(2),
    },
    {
      id: "m2",
      kind: "cleanup",
      title: "Cleanup completed",
      detail: "2.1 GB reclaimed from temporary files",
      at: hoursAgo(9),
    },
    {
      id: "m3",
      kind: "scan",
      title: "Disk analysis finished",
      detail: "Drive C: scanned — 84,192 items",
      at: hoursAgo(26),
    },
  ],
  startup: [
    {
      id: "s1",
      name: "Security Center",
      publisher: "Microsoft Corporation",
      enabled: true,
      impact: "high",
      path: "C:/Program Files/Security Center/agent.exe",
      source: "Registry Run key (demo data)",
    },
    {
      id: "s2",
      name: "Cloud Sync",
      publisher: "Northstar Labs",
      enabled: true,
      impact: "medium",
      path: "C:/Program Files/Cloud Sync/sync.exe",
      source: "Startup folder (demo data)",
    },
    {
      id: "s3",
      name: "Audio Control",
      publisher: "Realtek Semiconductor",
      enabled: true,
      impact: "low",
      path: "C:/Program Files/Realtek/audio.exe",
      source: "Registry Run key (demo data)",
    },
    {
      id: "s4",
      name: "Update Notifier",
      publisher: "Acme Software",
      enabled: false,
      impact: "medium",
      path: "C:/Program Files/Acme/notifier.exe",
      source: "Scheduled task (demo data)",
    },
    {
      id: "s5",
      name: "Printer Monitor",
      publisher: "Unknown publisher",
      enabled: false,
      impact: "low",
      path: "C:/Program Files/Printers/monitor.exe",
      source: "Registry Run key (demo data)",
    },
    {
      id: "s6",
      name: "Meeting Client",
      publisher: "Zoom Video Communications",
      enabled: true,
      impact: "high",
      path: "C:/Users/me/AppData/Local/Meeting/zoom.exe",
      source: "Startup folder (demo data)",
    },
  ],
  applications: [
    {
      id: "a1",
      name: "ZenDisk",
      publisher: "ZenDisk Project",
      version: "0.1.12",
      installedAt: "2026-11-18",
      estimatedBytes: 18 * 1024 * 1024,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a2",
      name: "Creative Suite",
      publisher: "Adobe Inc.",
      version: "26.4.1",
      installedAt: "2026-09-02",
      estimatedBytes: 8.2 * GB,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a3",
      name: "Developer Tools",
      publisher: "Microsoft Corporation",
      version: "17.12.0",
      installedAt: "2026-08-14",
      estimatedBytes: 5.7 * GB,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a4",
      name: "Web Browser",
      publisher: "Browser Foundation",
      version: "142.0.0",
      installedAt: "2026-07-30",
      estimatedBytes: 640 * 1024 * 1024,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a5",
      name: "Photo Library",
      publisher: "Northstar Labs",
      version: "5.3.2",
      installedAt: "2026-06-11",
      estimatedBytes: 2.4 * GB,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a6",
      name: "Audio Workstation",
      publisher: "Sound Forge",
      version: "12.1",
      installedAt: "2026-05-19",
      estimatedBytes: 1.1 * GB,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a7",
      name: "Meeting Client",
      publisher: "Zoom Video Communications",
      version: "6.2.0",
      installedAt: "2026-04-03",
      estimatedBytes: 320 * 1024 * 1024,
      source: "Installed programs registry (demo data)",
    },
    {
      id: "a8",
      name: "Utility Pack",
      publisher: "Unknown publisher",
      version: "2.0.9",
      installedAt: "2026-02-22",
      estimatedBytes: 92 * 1024 * 1024,
      source: "Installed programs registry (demo data)",
    },
  ],
  driveHealth: [
    {
      driveId: "C:",
      name: "System SSD",
      status: "healthy",
      summary: "No exposed attribute indicates degradation.",
      source: "SMART via NVMe (demo data)",
      limitations: [
        "Only attributes exposed by the device and driver are shown.",
        "Values are illustrative sample data, not a live measurement.",
      ],
      attributes: [
        { id: "c1", label: "Power-on hours", value: "1,842 h", supported: true },
        { id: "c2", label: "Reallocated sectors", value: "0", supported: true },
        {
          id: "c3",
          label: "Wear leveling count",
          value: "Not available",
          supported: false,
          note: "This controller does not report the attribute.",
        },
      ],
    },
    {
      driveId: "D:",
      name: "Storage HDD",
      status: "warning",
      summary: "One exposed attribute is outside the expected range.",
      source: "SMART via SATA (demo data)",
      limitations: [
        "USB bridges may hide health attributes.",
        "Values are illustrative sample data, not a live measurement.",
      ],
      attributes: [
        { id: "d1", label: "Reallocated sectors", value: "12", supported: true },
        { id: "d2", label: "Current pending sectors", value: "0", supported: true },
        {
          id: "d3",
          label: "Temperature",
          value: "Not available",
          supported: false,
          note: "The drive does not expose a temperature sensor.",
        },
      ],
    },
  ],
};

/** Simulated async fetch so loading/skeleton states are exercised in dev. */
export function fetchMaintenance(): Promise<MaintenanceData> {
  return new Promise((resolve) => setTimeout(() => resolve(maintenanceData), 300));
}
