import { useState, type ReactNode } from "react";
import { Copy, FolderCog, Sparkles } from "lucide-react";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";
import {
  EmptyState,
  InlineAlert,
  MetricCard,
  SkeletonCard,
} from "@/components/data-display";
import { formatBytes } from "@/lib/formatters";
import { nativeApi } from "@/lib/native/client";
import { useReports } from "@/hooks";
import { usePreferencesStore } from "@/stores";
import { RecentActivity } from "@/features/overview/components/activity/RecentActivity";
import { RecommendationList } from "@/features/overview/components/recommendations/RecommendationList";
import { StorageGrowthChart } from "./components/charts/StorageGrowthChart";
import type { ReportRange } from "@/types";

const ranges: { value: ReportRange; label: string }[] = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

interface StateGateProps {
  loading: boolean;
  error: boolean;
  denied?: boolean;
  empty: boolean;
  noResults: boolean;
  emptyHeading: string;
  emptyDescription: string;
  children: ReactNode;
}

function StateGate({
  loading,
  error,
  denied = false,
  empty,
  noResults,
  emptyHeading,
  emptyDescription,
  children,
}: StateGateProps) {
  if (error) {
    return (
      <InlineAlert variant="danger" title="Could not load reports">
        Check that operation history is available and refresh.
      </InlineAlert>
    );
  }
  if (denied) {
    return (
      <EmptyState
        heading="History access denied"
        description="ZenDisk cannot read operation history. Allow access and refresh."
      />
    );
  }
  if (loading) {
    return (
      <div className="grid gap-[var(--space-4)] desktop:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (empty) {
    return <EmptyState heading={emptyHeading} description={emptyDescription} />;
  }
  if (noResults) {
    return (
      <EmptyState
        heading="No readings in this period"
        description="Choose a longer period to see storage history."
      />
    );
  }
  return <>{children}</>;
}

export function ReportsScreen() {
  const { data, isLoading, isError, refetch } = useReports();
  const showSampleNotice = usePreferencesStore((state) => state.showSampleDataNotice);
  const isPreview = !nativeApi.app.isTauri();
  const [range, setRange] = useState<ReportRange>("30");

  const loading = isLoading || !data;
  const denied = data?.access === "denied";
  const metrics = data?.metrics[range];
  const days = Number(range);
  const cutoff = Date.now() - days * 86_400_000;
  const storage = (data?.storage ?? []).filter((point) => new Date(point.date).getTime() >= cutoff);
  const activity = (data?.activity ?? []).filter((event) => new Date(event.at).getTime() >= cutoff);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Understand how storage changes over time."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Reports" }]}
        actions={
          <>
            <Select value={range} onValueChange={(value) => setRange(value as ReportRange)}>
              <SelectTrigger className="w-40" aria-label="Report period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ranges.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void refetch()}>
              Refresh
            </Button>
          </>
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-[var(--space-6)]">
          {showSampleNotice && (
            <InlineAlert
              variant="info"
              title={isPreview ? "Sample data" : "Storage history unavailable"}
            >
              {isPreview
                ? "Report figures are illustrative in the browser preview."
                : "Used and free space snapshots are not collected yet. All other figures come from recorded operation history."}
            </InlineAlert>
          )}

          {denied && (
            <InlineAlert variant="danger" title="History access denied">
              Reports need read access to stored operation history.
            </InlineAlert>
          )}

          <StateGate
            loading={loading}
            error={isError}
            denied={denied}
            empty={!metrics || activity.length === 0}
            noResults={false}
            emptyHeading="No report data"
            emptyDescription="Reports will appear after the first operations are recorded."
          >
            <div className="grid gap-[var(--space-4)] desktop:grid-cols-3">
              <MetricCard
                label="Recovered"
                value={formatBytes(metrics?.recoveredBytes ?? 0)}
                description={`${metrics?.recoveredDelta ?? 0}% vs. previous period`}
                icon={<Sparkles size={16} aria-hidden="true" />}
              />
              <MetricCard
                label="Duplicates found"
                value={formatBytes(metrics?.duplicatesBytes ?? 0)}
                description={`${metrics?.duplicatesDelta ?? 0}% vs. previous period`}
                icon={<Copy size={16} aria-hidden="true" />}
              />
              <MetricCard
                label="Files organized"
                value={(metrics?.organizedFiles ?? 0).toLocaleString()}
                description={`${metrics?.organizedDelta ?? 0}% vs. previous period`}
                icon={<FolderCog size={16} aria-hidden="true" />}
              />
            </div>

            <Section title="Storage growth" description="Used and free space across the selected period.">
              {storage.length === 0 ? (
                <EmptyState
                  heading="No storage snapshots yet"
                  description="Used and free space history is not collected. Reclaimed figures come from operation history."
                />
              ) : (
                <StorageGrowthChart points={storage} />
              )}
            </Section>

            <Section title="Activity timeline" description="Operations recorded in this period.">
              <RecentActivity events={activity} />
            </Section>

            <Section title="Recommendations" description="Suggestions based on recent activity.">
              <RecommendationList recommendations={data?.recommendations ?? []} />
            </Section>
          </StateGate>
        </div>
      </PageContainer>
    </>
  );
}
