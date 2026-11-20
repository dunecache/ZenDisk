import type { ReactNode } from "react";
import { Cpu, HardDrive, MemoryStick, Thermometer } from "lucide-react";
import { DateDisplay, ProgressBar } from "@/components/data-display";
import { Card, Section } from "@/components/layout";
import { RecentActivity } from "@/features/overview/components/activity/RecentActivity";
import type { ActivityEvent, ResourceMetric } from "@/types";

const icons: Record<string, ReactNode> = {
  cpu: <Cpu size={16} aria-hidden="true" />,
  memory: <MemoryStick size={16} aria-hidden="true" />,
  "disk-activity": <HardDrive size={16} aria-hidden="true" />,
  temperature: <Thermometer size={16} aria-hidden="true" />,
};

export interface ResourceMetricCardProps {
  metric: ResourceMetric;
}

/** One resource reading. Unsupported metrics are shown as unavailable. */
export function ResourceMetricCard({ metric }: ResourceMetricCardProps) {
  return (
    <Card className="flex flex-col gap-[var(--space-3)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <span className="text-[length:var(--text-small)] text-muted">{metric.label}</span>
        <span className="text-muted" aria-hidden="true">
          {icons[metric.id]}
        </span>
      </div>
      <strong className="text-[length:var(--text-metric)] font-semibold tabular-nums">
        {metric.displayValue}
      </strong>
      {metric.supported ? (
        <ProgressBar
          value={metric.value}
          max={metric.max}
          state={metric.state}
          ariaLabel={metric.label}
        />
      ) : (
        <span className="text-[length:var(--text-small)] text-muted">
          Not measured on this system
        </span>
      )}
      <span className="text-[length:var(--text-small)] text-muted">{metric.detail}</span>
    </Card>
  );
}

export interface MaintenanceOverviewProps {
  metrics: ResourceMetric[];
  events: ActivityEvent[];
  collectedAt: string;
}

export function MaintenanceOverview({
  metrics,
  events,
  collectedAt,
}: MaintenanceOverviewProps) {
  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <Section
        title="System resources"
        description={
          <span>
            Last collected <DateDisplay value={collectedAt} />. Values shown are sample data.
          </span>
        }
      >
        <div className="grid gap-[var(--space-4)] sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <ResourceMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </Section>

      <Section title="Recent maintenance events">
        <RecentActivity events={events} />
      </Section>
    </div>
  );
}
