import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DateDisplay,
  EmptyState,
  StatusBadge,
} from "@/components/data-display";
import type { AutomationResult, AutomationRun } from "@/types";

const resultStatus: Record<
  AutomationResult,
  { status: "completed" | "warning" | "failed" | "paused"; label: string }
> = {
  success: { status: "completed", label: "Success" },
  partial: { status: "warning", label: "Partial" },
  failed: { status: "failed", label: "Failed" },
  cancelled: { status: "paused", label: "Cancelled" },
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export interface RunHistoryTableProps {
  runs: AutomationRun[];
}

export function RunHistoryTable({ runs }: RunHistoryTableProps) {
  const columns = useMemo<ColumnDef<AutomationRun, any>[]>(
    () => [
      {
        accessorKey: "startedAt",
        header: "Started",
        cell: ({ getValue }) => <DateDisplay value={getValue<string>()} />,
      },
      { accessorKey: "taskName", header: "Task" },
      {
        accessorKey: "durationMs",
        header: "Duration",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{formatDuration(getValue<number>())}</span>
        ),
      },
      {
        accessorKey: "result",
        header: "Result",
        cell: ({ getValue }) => {
          const result = resultStatus[getValue<AutomationResult>()];
          return <StatusBadge status={result.status} label={result.label} />;
        },
      },
      {
        accessorKey: "filesProcessed",
        header: "Processed",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>().toLocaleString()}</span>
        ),
      },
      {
        accessorKey: "quarantined",
        header: "Quarantined",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{getValue<number>().toLocaleString()}</span>
        ),
      },
      {
        id: "errors",
        header: "Errors",
        cell: ({ row }) =>
          row.original.errors.length > 0 ? (
            <span className="text-[length:var(--text-small)] text-warning">
              {row.original.errors.length} {row.original.errors.length === 1 ? "note" : "notes"}
              <span className="sr-only">: {row.original.errors.join("; ")}</span>
            </span>
          ) : (
            <span className="text-[length:var(--text-small)] text-muted">None</span>
          ),
      },
    ],
    [],
  );

  return (
    <DataTable
      data={runs}
      columns={columns}
      selectable={false}
      getRowId={(row) => row.id}
      emptyState={
        <EmptyState
          heading="No matching runs"
          description="Try a different task name or status filter."
        />
      }
    />
  );
}
