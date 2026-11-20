import { useState, type ReactNode } from "react";
import { PageContainer } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { EmptyState, InlineAlert, SkeletonCard } from "@/components/data-display";
import { useMaintenance } from "@/hooks";
import {
  ApplicationsTable,
  DiskHealthList,
  MaintenanceOverview,
  StartupList,
} from "./components";

type MaintenanceTab = "overview" | "startup" | "applications" | "health";

const tabs: { value: MaintenanceTab; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "startup", label: "Startup" },
  { value: "applications", label: "Applications" },
  { value: "health", label: "Disk health" },
];

interface StateGateProps {
  loading: boolean;
  error: boolean;
  empty?: boolean;
  emptyHeading?: string;
  emptyDescription?: string;
  children: ReactNode;
}

function StateGate({
  loading,
  error,
  empty = false,
  emptyHeading = "Nothing to show",
  emptyDescription,
  children,
}: StateGateProps) {
  if (error) {
    return (
      <InlineAlert variant="danger" title="Could not load maintenance data">
        Check system access and refresh.
      </InlineAlert>
    );
  }
  if (loading) {
    return (
      <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }
  if (empty) {
    return <EmptyState heading={emptyHeading} description={emptyDescription} />;
  }
  return <>{children}</>;
}

export function MaintenanceScreen() {
  const { data, isLoading, isError, refetch } = useMaintenance();
  const [tab, setTab] = useState<MaintenanceTab>("overview");

  const loading = isLoading || !data;

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Review system health, startup entries, and installed software."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Maintenance" }]}
        actions={<Button onClick={() => void refetch()}>Refresh</Button>}
      />
      <PageContainer>
        <div className="flex flex-col gap-[var(--space-6)]">
          <InlineAlert variant="info" title="Sample data">
            Native system access is not connected yet. Values are illustrative;
            metrics the system cannot report are marked as not available.
          </InlineAlert>

          <Tabs value={tab} onValueChange={(value) => setTab(value as MaintenanceTab)}>
            <TabsList>
              {tabs.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview">
              <StateGate
                loading={loading}
                error={isError}
                empty={!data?.metrics.length && !data?.events.length}
                emptyHeading="No system readings"
                emptyDescription="Resource metrics and recent events will appear here."
              >
                <MaintenanceOverview
                  metrics={data?.metrics ?? []}
                  events={data?.events ?? []}
                  collectedAt={data?.collectedAt ?? new Date().toISOString()}
                />
              </StateGate>
            </TabsContent>

            <TabsContent value="startup">
              <StateGate
                loading={loading}
                error={isError}
                empty={!data?.startup.length}
                emptyHeading="No startup entries"
                emptyDescription="No startup applications could be identified."
              >
                <StartupList entries={data?.startup ?? []} />
              </StateGate>
            </TabsContent>

            <TabsContent value="applications">
              <StateGate
                loading={loading}
                error={isError}
                empty={!data?.applications.length}
                emptyHeading="No applications found"
                emptyDescription="The installed application list is empty or unavailable."
              >
                <ApplicationsTable applications={data?.applications ?? []} />
              </StateGate>
            </TabsContent>

            <TabsContent value="health">
              <StateGate
                loading={loading}
                error={isError}
                empty={!data?.driveHealth.length}
                emptyHeading="No health data"
                emptyDescription="No drive exposes health information to ZenDisk."
              >
                <DiskHealthList drives={data?.driveHealth ?? []} />
              </StateGate>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </>
  );
}
