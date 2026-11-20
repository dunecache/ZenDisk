import { HardDrive, CircleCheck } from "lucide-react";
import { MetricCard, StorageBar } from "@/components/data-display";
import { formatBytes } from "@/lib/formatters";
import type { DriveInfo } from "@/types";

export interface StorageSummaryProps {
  drives: DriveInfo[];
}

const chartColors = [
  "var(--chart-system)",
  "var(--chart-applications)",
  "var(--chart-documents)",
  "var(--chart-images)",
  "var(--chart-videos)",
  "var(--chart-other)",
];

export function StorageSummary({ drives }: StorageSummaryProps) {
  const total = drives.reduce((sum, drive) => sum + drive.capacity, 0);
  const available = drives.reduce((sum, drive) => sum + drive.free, 0);
  const used = total - available;

  const segments = drives.map((drive, index) => ({
    label: `${drive.letter ?? drive.name} used`,
    bytes: drive.capacity - drive.free,
    color: chartColors[index % chartColors.length],
  }));
  segments.push({ label: "Available", bytes: available, color: "var(--accent)" });

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
        <MetricCard
          label="Total storage"
          value={formatBytes(total)}
          icon={<HardDrive size={16} />}
        />
        <MetricCard
          label="Available"
          value={formatBytes(available)}
          description={`${formatBytes(used)} in use`}
          icon={<CircleCheck size={16} />}
        />
      </div>
      <StorageBar segments={segments} />
    </div>
  );
}
