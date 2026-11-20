import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import {
  FilterBar,
  InlineAlert,
  MetricCard,
  ProgressBar,
  SearchInput,
  SkeletonCard,
} from "@/components/data-display";
import { formatBytes } from "@/lib/formatters";
import { useAnalysis, useOverview } from "@/hooks";
import { DriveSelector } from "./components/scan/DriveSelector";
import { ScanStatus } from "./components/scan/ScanStatus";
import { TreemapView } from "./components/treemap/TreemapView";
import { FileTypeBreakdown } from "./components/breakdown/FileTypeBreakdown";
import { LargestFiles } from "./components/largest-files/LargestFiles";
import { LargestFolders } from "./components/folders/LargestFolders";

export function DiskAnalysisScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const driveId = searchParams.get("drive") ?? "C:";
  const [query, setQuery] = useState("");

  const { data: overview } = useOverview();
  const { data, isLoading, isError, refetch } = useAnalysis(driveId);

  const setDrive = (id: string) => setSearchParams({ drive: id });

  const files = data?.largestFiles.filter((file) =>
    file.name.toLowerCase().includes(query.trim().toLowerCase()),
  ) ?? [];

  return (
    <>
      <PageHeader
        title="Disk analysis"
        description="Understand the contents of a selected drive."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Disk analysis" }]}
        selector={
          overview && (
            <DriveSelector drives={overview.drives} value={driveId} onChange={setDrive} />
          )
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-[var(--space-8)]">
          <Section>
            <ScanStatus
              state={data?.scanState ?? "idle"}
              isPartial={data?.isPartial}
              onScan={() => void refetch()}
            />
          </Section>

          {isError ? (
            <InlineAlert variant="danger" title="Analysis failed">
              The drive could not be analyzed. Check permissions and try again.
            </InlineAlert>
          ) : isLoading || !data ? (
            <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <>
              <Section title="Capacity summary">
                <div className="grid gap-[var(--space-4)] desktop:grid-cols-3">
                  <MetricCard label="Capacity" value={formatBytes(data.capacity)} />
                  <MetricCard label="Available" value={formatBytes(data.free)} />
                  <MetricCard
                    label="Scanned"
                    value={formatBytes(data.scannedBytes)}
                    description={`${new Intl.NumberFormat().format(data.scannedItems)} items`}
                  />
                </div>
                <ProgressBar
                  value={data.capacity - data.free}
                  max={data.capacity}
                  showLabel
                  label="Used space"
                />
              </Section>

              <Section title="Filters">
                <FilterBar>
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="Filter largest files"
                  />
                </FilterBar>
              </Section>

              <Section title="Storage map">
                <TreemapView tree={data.tree} />
              </Section>

              <div className="grid gap-[var(--space-4)] desktop:grid-cols-2">
                <FileTypeBreakdown
                  stats={data.typeBreakdown}
                  totalBytes={data.scannedBytes}
                />
                <LargestFiles files={files} />
              </div>

              <Section title="Folders">
                <LargestFolders folders={data.largestFolders} />
              </Section>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}
