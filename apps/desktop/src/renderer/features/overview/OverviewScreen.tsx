import { useNavigate } from "react-router-dom";
import { Copy, FolderCog, HardDrive, Sparkles } from "lucide-react";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { DriveCard, InlineAlert, SkeletonCard } from "@/components/data-display";
import { useOverview } from "@/hooks";
import { StorageSummary } from "./components/dashboard/StorageSummary";
import { QuickAction } from "./components/quick-actions/QuickAction";
import { RecentActivity } from "./components/activity/RecentActivity";
import { RecommendationList } from "./components/recommendations/RecommendationList";

const quickActions = [
  { label: "Analyze", description: "Explore drive contents", icon: HardDrive, to: "/disk-analysis" },
  { label: "Clean", description: "Reclaim space safely", icon: Sparkles, to: "/cleanup" },
  { label: "Organize", description: "Apply file rules", icon: FolderCog, to: "/organization" },
  { label: "Duplicates", description: "Find identical files", icon: Copy, to: "/duplicates" },
];

export function OverviewScreen() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useOverview();

  return (
    <>
      <PageHeader
        title="Overview"
        description="Your storage at a glance."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Overview" }]}
      />
      <PageContainer>
        {isError ? (
          <InlineAlert variant="danger" title="Could not load storage information">
            Check that the native service is available, then try again.
            <button className="ml-[var(--space-2)] rounded-[var(--radius-xs)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]" onClick={() => void refetch()}>
              Retry
            </button>
          </InlineAlert>
        ) : isLoading || !data ? (
          <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="flex flex-col gap-[var(--space-8)]">
            <Section title="Storage">
              <StorageSummary drives={data.drives} />
              <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
                {data.drives.map((drive) => (
                  <DriveCard
                    key={drive.id}
                    name={drive.name}
                    letter={drive.letter}
                    type={drive.type}
                    filesystem={drive.filesystem}
                    capacity={drive.capacity}
                    free={drive.free}
                    onClick={() => navigate(`/disk-analysis?drive=${drive.id}`)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Quick actions" description="Jump into a workflow.">
              <div className="grid gap-[var(--space-3)] sm:grid-cols-2 xl:grid-cols-4">
                {quickActions.map((action) => (
                  <QuickAction
                    key={action.to}
                    label={action.label}
                    description={action.description}
                    icon={action.icon}
                    onClick={() => navigate(action.to)}
                  />
                ))}
              </div>
            </Section>

            <Section title="Recent activity">
              <RecentActivity events={data.activity} />
            </Section>

            <Section title="Recommendations" description="Based on your latest scan results.">
              <RecommendationList recommendations={data.recommendations} />
            </Section>
          </div>
        )}
      </PageContainer>
    </>
  );
}
