import { useState } from "react";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { EmptyState, FileSize, FilterBar, InlineAlert, SearchInput, SkeletonCard } from "@/components/data-display";
import { toast, useOperationHistory } from "@/stores";
import { useDuplicates } from "@/hooks";
import { DuplicateGroupCard } from "./components/groups/DuplicateGroupCard";
import { HashDetailsDialog } from "./components/comparison/HashDetailsDialog";
import { QuarantineDialog } from "./components/quarantine/QuarantineDialog";
import type { DuplicateGroup, DuplicateTab, OperationRecord } from "@/types";

const tabs: { value: DuplicateTab; label: string }[] = [
  { value: "exact", label: "Exact" },
  { value: "names", label: "Similar names" },
  { value: "images", label: "Similar images" },
  { value: "media", label: "Similar media" },
];

export function DuplicatesScreen() {
  const { data, isLoading, isError, refetch } = useDuplicates();
  const [tab, setTab] = useState<DuplicateTab>("exact");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hashGroup, setHashGroup] = useState<DuplicateGroup | null>(null);
  const [query, setQuery] = useState("");
  const addOperation = useOperationHistory((state) => state.add);

  const groups = (data?.groups ?? []).filter(
    (group) => group.kind === tab &&
      (query.trim() === "" || group.files.some((file) => file.name.toLowerCase().includes(query.toLowerCase()))),
  );

  const selectedFiles = (data?.groups ?? [])
    .flatMap((group) => group.files)
    .filter((file) => selected.has(file.id));
  const selectedBytes = selectedFiles.reduce((sum, file) => sum + file.sizeBytes, 0);

  const toggle = (id: string, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const quarantine = () => {
    const record: OperationRecord = {
      id: crypto.randomUUID(),
      kind: "duplicates",
      title: "Duplicate quarantine",
      at: new Date().toISOString(),
      completed: selectedFiles.length,
      failed: 0,
      skipped: 0,
      total: selectedFiles.length,
      reclaimedBytes: selectedBytes,
      recoverable: true,
    };
    addOperation(record);
    setSelected(new Set());
    toast.success("Copies quarantined", `${selectedFiles.length} files moved (recoverable)`);
  };

  return (
    <>
      <PageHeader
        title="Duplicates"
        description="Find identical files. You decide which copies to keep."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Duplicates" }]}
        actions={<Button onClick={() => void refetch()}>Scan</Button>}
      />
      <PageContainer>
        <Tabs value={tab} onValueChange={(value) => setTab(value as DuplicateTab)}>
          <TabsList>
            {tabs.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab}>
            <div className="flex flex-col gap-[var(--space-5)]">
              <Section title="Filters">
                <FilterBar>
                  <SearchInput value={query} onChange={setQuery} placeholder="Filter duplicates" />
                </FilterBar>
              </Section>

              {isError ? (
                <InlineAlert variant="danger" title="Scan failed">Check permissions and scan again.</InlineAlert>
              ) : isLoading ? (
                <div className="grid gap-[var(--space-4)] sm:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
              ) : groups.length === 0 ? (
                <EmptyState heading="No duplicates found" description="Try another tab or run a new scan." />
              ) : (
                groups.map((group) => (
                  <DuplicateGroupCard
                    key={group.id}
                    group={group}
                    selected={selected}
                    onToggle={toggle}
                    onShowHash={setHashGroup}
                  />
                ))
              )}

              <div className="flex items-center justify-between gap-[var(--space-3)] rounded-[var(--radius-md)] border border-border bg-surface px-[var(--space-5)] py-[var(--space-3)]">
                <span className="text-[length:var(--text-body)]">
                  Selected: <strong className="tabular-nums">{selectedFiles.length}</strong> files
                  <span className="ml-[var(--space-2)] text-muted"><FileSize bytes={selectedBytes} /></span>
                </span>
                <QuarantineDialog files={selectedFiles} onConfirm={quarantine} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PageContainer>

      <HashDetailsDialog group={hashGroup} onClose={() => setHashGroup(null)} />
    </>
  );
}
