import { useState } from "react";
import { PageContainer, Section, SplitPanel } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { EmptyState, InlineAlert, SkeletonCard } from "@/components/data-display";
import { toast, useOperationHistory } from "@/stores";
import { useOrganization } from "@/hooks";
import { RuleList } from "./components/rule-list/RuleList";
import { RuleEditor } from "./components/rule-builder/RuleEditor";
import { PreviewTable } from "./components/preview/PreviewTable";
import type { OperationRecord, ProposedChange } from "@/types";

export function OrganizationScreen() {
  const { data, isLoading, isError, refetch } = useOrganization();
  const [selectedId, setSelectedId] = useState<string | undefined>("r1");
  const addOperation = useOperationHistory((state) => state.add);

  const rule = data?.rules.find((item) => item.id === selectedId) ?? null;

  const apply = (changes: ProposedChange[]) => {
    const record: OperationRecord = {
      id: crypto.randomUUID(),
      kind: "organize",
      title: "Organization applied",
      at: new Date().toISOString(),
      completed: changes.length,
      failed: 0,
      skipped: (data?.changes.length ?? 0) - changes.length,
      total: data?.changes.length ?? changes.length,
      reclaimedBytes: 0,
      recoverable: true,
    };
    addOperation(record);
    toast.success("Organization applied", `${changes.length} changes recorded`);
  };

  return (
    <>
      <PageHeader
        title="Organization"
        description="Manage reusable rules for organizing files."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Organization" }]}
        actions={<Button onClick={() => toast.info("New rule", "Rule creation opens in a later iteration.")}>+ New rule</Button>}
      />
      <PageContainer>
        <Tabs defaultValue="rules">
          <TabsList>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            {isError ? (
              <InlineAlert variant="danger" title="Could not load rules">Check the native service and try again.</InlineAlert>
            ) : isLoading || !data ? (
              <div className="grid gap-[var(--space-4)] sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
            ) : (
              <SplitPanel
                primary={
                  <Section title="Rule list">
                    <RuleList rules={data.rules} selectedId={selectedId} onSelect={setSelectedId} />
                  </Section>
                }
                secondary={
                  <Section title="Rule editor">
                    <RuleEditor
                      rule={rule}
                      onPreview={() => toast.info("Preview", "Switch to the Preview tab.")}
                      onSave={() => toast.success("Rule saved", `${rule?.name} saved`)}
                    />
                  </Section>
                }
              />
            )}
          </TabsContent>

          <TabsContent value="templates">
            <EmptyState heading="Templates" description="Prebuilt rule templates will be available here." />
          </TabsContent>
          <TabsContent value="preview">
            <Section title="Proposed changes" description="Review conflicts before applying.">
              <PreviewTable changes={data?.changes ?? []} onApply={apply} />
            </Section>
          </TabsContent>
          <TabsContent value="history">
            <EmptyState heading="No history yet" description="Applied operations will appear here." />
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
