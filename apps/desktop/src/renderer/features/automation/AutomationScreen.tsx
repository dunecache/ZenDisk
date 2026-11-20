import { useState, type ReactNode } from "react";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import {
  EmptyState,
  FilterBar,
  InlineAlert,
  SearchInput,
  SkeletonCard,
} from "@/components/data-display";
import { toast, usePreferencesStore } from "@/stores";
import { useAutomation, useAutomationActions } from "@/hooks";
import { RunHistoryTable, TaskCard, TaskEditorDialog } from "./components";
import type { AutomationTask } from "@/types";

type AutomationTab = "tasks" | "history";

interface StateGateProps {
  loading: boolean;
  error: boolean;
  denied?: boolean;
  deniedAction?: ReactNode;
  empty: boolean;
  noResults: boolean;
  emptyHeading: string;
  emptyDescription: string;
  noResultsHeading?: string;
  children: ReactNode;
}

function StateGate({
  loading,
  error,
  denied = false,
  deniedAction,
  empty,
  noResults,
  emptyHeading,
  emptyDescription,
  noResultsHeading = "No matching results",
  children,
}: StateGateProps) {
  if (error) {
    return (
      <InlineAlert variant="danger" title="Could not load automation data">
        Check Task Scheduler access and refresh.
      </InlineAlert>
    );
  }
  if (denied) {
    return (
      <EmptyState
        heading="Task Scheduler access denied"
        description="ZenDisk cannot read or change scheduled tasks. Allow access, then refresh."
        action={deniedAction}
      />
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
  if (noResults) {
    return (
      <EmptyState
        heading={noResultsHeading}
        description="Try a different name or target."
      />
    );
  }
  return <>{children}</>;
}

export function AutomationScreen() {
  const { data, isLoading, isError, refetch } = useAutomation();
  const actions = useAutomationActions();
  const showSampleNotice = usePreferencesStore((state) => state.showSampleDataNotice);
  const [tab, setTab] = useState<AutomationTab>("tasks");
  const [taskQuery, setTaskQuery] = useState("");
  const [runQuery, setRunQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationTask | null>(null);

  const currentTasks = data?.tasks ?? [];
  const runs = data?.runs ?? [];
  const denied = data?.access === "denied";
  const loading = isLoading || !data;

  const filteredTasks = currentTasks.filter((task) => {
    const query = taskQuery.trim().toLowerCase();
    return (
      query === "" ||
      task.name.toLowerCase().includes(query) ||
      task.target.toLowerCase().includes(query)
    );
  });

  const filteredRuns = runs.filter((run) => {
    const query = runQuery.trim().toLowerCase();
    return query === "" || run.taskName.toLowerCase().includes(query) || run.result.includes(query);
  });

  const attentionRuns = filteredRuns.filter(
    (run) => run.result === "partial" || run.result === "failed",
  );

  const toggleTask = (id: string, enabled: boolean) => {
    const task = currentTasks.find((item) => item.id === id);
    if (!task) return;
    actions.mutate({ type: "toggle", id, enabled });
    toast.info(
      enabled ? "Task enabled (preview)" : "Task disabled (preview)",
      "Native Task Scheduler control is not connected yet.",
    );
  };

  const saveTask = (task: AutomationTask) => {
    const isEdit = currentTasks.some((item) => item.id === task.id);
    actions.mutate({ type: "save", task });
    toast.success(
      isEdit ? "Task updated (preview)" : "Task created (preview)",
      "Stored in the preview until native access is connected.",
    );
  };

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (task: AutomationTask) => {
    setEditing(task);
    setEditorOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Automation"
        description="Schedule maintenance tasks and review what they did."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Automation" }]}
        actions={
          <>
            <Button variant="outline" onClick={() => void refetch()}>
              Refresh
            </Button>
            <Button disabled={loading} onClick={openNew}>
              New task
            </Button>
          </>
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-[var(--space-6)]">
          {showSampleNotice && (
            <InlineAlert variant="info" title="Sample data">
              Scheduled tasks and runs are illustrative. Native Task Scheduler
              control is not connected yet; edits stay in this preview.
            </InlineAlert>
          )}

          {denied && (
            <InlineAlert variant="danger" title="Access to scheduled tasks was denied">
              ZenDisk cannot read or change Windows tasks until access is
              restored. You can still disable a task here; the request is held
              in this preview until native access is connected.
            </InlineAlert>
          )}

          <Tabs value={tab} onValueChange={(value) => setTab(value as AutomationTab)}>
            <TabsList>
              <TabsTrigger value="tasks">Scheduled tasks</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              <StateGate
                loading={loading}
                error={isError}
                empty={currentTasks.length === 0}
                noResults={taskQuery.trim() !== "" && filteredTasks.length === 0}
                noResultsHeading="No matching tasks"
                emptyHeading="No scheduled tasks"
                emptyDescription="Create a task to automate a maintenance operation."
              >
                <Section
                  title="Scheduled tasks"
                  description="Every task can be disabled at any time. Scheduled actions only quarantine files or report findings."
                  actions={
                    <span className="text-[length:var(--text-small)] text-muted tabular-nums">
                      {filteredTasks.length} of {currentTasks.length}
                    </span>
                  }
                >
                  <FilterBar>
                    <SearchInput
                      value={taskQuery}
                      onChange={setTaskQuery}
                      placeholder="Filter tasks or targets"
                    />
                  </FilterBar>
                  <div className="grid gap-[var(--space-4)] desktop:grid-cols-2">
                    {filteredTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onToggle={toggleTask} onEdit={openEdit} />
                    ))}
                  </div>
                </Section>
              </StateGate>
            </TabsContent>

            <TabsContent value="history">
              <StateGate
                loading={loading}
                error={isError}
                denied={denied}
                deniedAction={<Button onClick={() => void refetch()}>Try again</Button>}
                empty={runs.length === 0}
                noResults={runQuery.trim() !== "" && filteredRuns.length === 0}
                noResultsHeading="No matching runs"
                emptyHeading="No runs recorded"
                emptyDescription="Runs will appear here once a scheduled task executes."
              >
                <Section
                  title="Run history"
                  description="Start time, duration, result, and file counts for each scheduled run."
                >
                  <FilterBar>
                    <SearchInput
                      value={runQuery}
                      onChange={setRunQuery}
                      placeholder="Filter by task or result"
                    />
                  </FilterBar>
                  {attentionRuns.length > 0 && (
                    <InlineAlert variant="warning" title="Some runs need attention">
                      {attentionRuns.length} run(s) ended partial or failed.
                      Review the error notes before changing a task.
                    </InlineAlert>
                  )}
                  <RunHistoryTable runs={filteredRuns} />
                  <p className="text-[length:var(--text-small)] text-muted">
                    History is sample data. Real runs will be stored in SQLite
                    so headless and interactive runs can both write safely.
                  </p>
                </Section>
              </StateGate>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>

      <TaskEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        task={editing}
        onSave={saveTask}
      />
    </>
  );
}
