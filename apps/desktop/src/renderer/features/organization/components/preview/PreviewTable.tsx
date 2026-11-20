import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { DataTable, StatusBadge } from "@/components/data-display";
import type { ProposedChange } from "@/types";

export interface PreviewTableProps {
  changes: ProposedChange[];
  onApply: (changes: ProposedChange[]) => void;
}

const helper = createColumnHelper<ProposedChange>();

export function PreviewTable({ changes, onApply }: PreviewTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(changes.map((change) => change.id)));

  const columns = useMemo(
    () => [
      helper.accessor("original", {
        header: "Original location",
        cell: (info) => <span className="break-all text-mono text-[length:var(--text-small)]">{info.getValue()}</span>,
      }),
      helper.accessor("proposed", {
        header: "Proposed location",
        cell: (info) => <span className="break-all text-mono text-[length:var(--text-small)]">{info.getValue()}</span>,
      }),
      helper.accessor("action", { header: "Action" }),
      helper.accessor("conflict", {
        header: "Conflict",
        cell: (info) => (
          <StatusBadge
            status={info.getValue() === "none" ? "healthy" : "warning"}
            label={info.getValue() === "none" ? "Clear" : info.getValue() === "exists" ? "Destination exists" : "Overlap"}
          />
        ),
      }),
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      <DataTable
        data={changes}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={selected}
        onSelectionChange={setSelected}
        pageSize={10}
      />
      <button
        type="button"
        className="self-start text-[length:var(--text-body)] text-primary hover:underline"
        onClick={() => onApply(changes.filter((change) => selected.has(change.id)))}
      >
        Apply selected changes
      </button>
    </div>
  );
}
