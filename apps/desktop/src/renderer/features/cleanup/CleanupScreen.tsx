import { useState } from "react";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { EmptyState, FileSize, InlineAlert, SkeletonCard } from "@/components/data-display";
import { toast, useOperationHistory } from "@/stores";
import { useCleanup } from "@/hooks";
import { CategoryList } from "./components/results/CategoryList";
import { ReviewDialog } from "./components/review/ReviewDialog";
import { CleanupSummary } from "./components/summary/CleanupSummary";
import type { OperationRecord } from "@/types";

export function CleanupScreen() {
  const { data, isLoading, isError, refetch } = useCleanup();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lastRecord, setLastRecord] = useState<OperationRecord | null>(null);
  const addOperation = useOperationHistory((state) => state.add);

  const categories = data?.categories ?? [];
  const selectedCategories = categories.filter((category) => selected.has(category.id));
  const selectedBytes = selectedCategories.reduce((sum, category) => sum + category.bytes, 0);
  const selectedFiles = selectedCategories.reduce((sum, category) => sum + category.fileCount, 0);

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const execute = () => {
    const record: OperationRecord = {
      id: crypto.randomUUID(),
      kind: "cleanup",
      title: "Cleanup",
      at: new Date().toISOString(),
      completed: selectedFiles,
      failed: 0,
      skipped: 0,
      total: selectedFiles,
      reclaimedBytes: selectedBytes,
      recoverable: true,
    };
    addOperation(record);
    setLastRecord(record);
    setSelected(new Set());
    toast.success("Cleanup completed", `${selectedFiles} files moved to quarantine`);
  };

  return (
    <>
      <PageHeader
        title="Cleanup"
        description="Identify files suitable for cleanup and reclaim space."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Cleanup" }]}
        actions={<Button onClick={() => void refetch()}>Scan</Button>}
      />
      <PageContainer>
        <Tabs defaultValue="quick">
          <TabsList>
            <TabsTrigger value="quick">Quick scan</TabsTrigger>
            <TabsTrigger value="custom">Custom cleanup</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <div className="flex flex-col gap-[var(--space-6)]">
              {isError ? (
                <InlineAlert variant="danger" title="Scan failed">
                  The cleanup scan could not complete. Check permissions and try again.
                </InlineAlert>
              ) : isLoading ? (
                <div className="grid gap-[var(--space-4)] sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
              ) : categories.length === 0 ? (
                <EmptyState heading="Nothing to clean" description="No cleanup candidates were found." />
              ) : (
                <>
                  <Section title="Scan results" description="Review each category — not all files are safe to remove.">
                    <CategoryList categories={categories} selected={selected} onToggle={toggle} />
                  </Section>
                  <div className="flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border border-border bg-surface px-[var(--space-5)] py-[var(--space-3)]">
                    <span className="text-[length:var(--text-body)]">
                      Selected: <strong className="tabular-nums"><FileSize bytes={selectedBytes} /></strong>
                      <span className="ml-[var(--space-2)] text-muted">({selectedFiles} files)</span>
                    </span>
                    <Button disabled={selected.size === 0} onClick={() => setReviewOpen(true)}>
                      Review
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom">
            <EmptyState heading="Custom cleanup" description="Define your own cleanup targets. Available in a later iteration." />
          </TabsContent>
          <TabsContent value="advanced">
            <EmptyState heading="Advanced cleanup" description="Advanced rules and filters. Available in a later iteration." />
          </TabsContent>
        </Tabs>
      </PageContainer>

      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        categories={selectedCategories}
        onConfirm={execute}
      />
      <CleanupSummary record={lastRecord} onClose={() => setLastRecord(null)} />
    </>
  );
}
