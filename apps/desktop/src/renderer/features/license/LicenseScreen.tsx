import { CircleCheck, Sparkles } from "lucide-react";
import { Card, PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button } from "@/components/ui";
import { EmptyState, InlineAlert, SkeletonCard } from "@/components/data-display";
import { useSettings, useAppVersion } from "@/hooks";

const included = [
  "Storage analysis and cleanup previews",
  "Organization rules with conflict review",
  "Duplicate detection with recoverable quarantine",
  "Maintenance reports and scheduled tasks",
];

export function LicenseScreen() {
  const { data, isLoading, isError, refetch } = useSettings();
  const { data: version } = useAppVersion();

  return (
    <>
      <PageHeader
        title="License and plan"
        description="See what is included in your ZenDisk plan."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "License and plan" }]}
      />
      <PageContainer>
        {isError ? (
          <InlineAlert variant="danger" title="Could not load license information">
            <button className="rounded-[var(--radius-xs)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]" onClick={() => void refetch()}>
              Try again
            </button>
          </InlineAlert>
        ) : data?.access === "denied" ? (
          <EmptyState
            heading="License access denied"
            description="ZenDisk cannot read plan information until access is restored."
            action={<Button onClick={() => void refetch()}>Try again</Button>}
          />
        ) : isLoading || !data ? (
          <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="flex flex-col gap-[var(--space-6)]">
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
                <div className="flex flex-col gap-[var(--space-2)]">
                  <span className="flex items-center gap-[var(--space-2)] text-[length:var(--text-h2)] font-semibold">
                    <Sparkles size={18} className="text-primary" aria-hidden="true" />
                    Free plan
                  </span>
                  <p className="text-[length:var(--text-body)] text-muted">
                    Local storage tools, no account required. Version{" "}
                    <span className="tabular-nums">{version ?? data.currentVersion}</span>.
                  </p>
                </div>
                <Button variant="outline" disabled onClick={() => undefined}>
                  Choose a plan
                </Button>
              </div>
              <ul className="mt-[var(--space-5)] flex flex-col gap-[var(--space-2)]">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-[var(--space-2)] text-[length:var(--text-body)]">
                    <CircleCheck size={16} className="text-success" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Section title="Plan management">
              <InlineAlert variant="info" title="Not connected yet">
                Paid plans and billing are not available in this preview.
                Choosing a plan never happens implicitly.
              </InlineAlert>
            </Section>
          </div>
        )}
      </PageContainer>
    </>
  );
}
