import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { DataTable, InlineAlert, StatusBadge } from "@/components/data-display";
import type { ProposedChange } from "@/types";

export interface PreviewTableProps {
  changes: ProposedChange[];
  onApply: (changes: ProposedChange[]) => void;
}

const helper = createColumnHelper<ProposedChange>();

export function PreviewTable({ changes, onApply }: PreviewTableProps) {
  // Conflicts are never preselected; the user must explicitly resolve them.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(changes.filter((change) => change.conflict === "none").map((change) => change.id)),
  );

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

  const applicable = changes.filter(
    (change) => selected.has(change.id) && change.conflict === "none",
  );
  const conflictCount = changes.filter((change) => change.conflict !== "none").length;

  return (
    <div className="flex flex-col gap-[var(--space-3)]">
      {conflictCount > 0 && (
        <InlineAlert variant="warning" title="Conflicts excluded">
          {conflictCount} change(s) have an existing destination or overlap.
          They are never applied from this preview.
        </InlineAlert>
      )}
      <DataTable
        data={changes}
        columns={columns}
        getRowId={(row) => row.id}
        selectedIds={selected}
        onSelectionChange={setSelected}
        pageSize={10}
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="self-start" disabled={applicable.length === 0}>
            Apply selected changes
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply organization changes</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-[var(--space-2)]">
                <span>
                  {applicable.length} change(s) will be applied. Conflicting
                  destinations are excluded.
                </span>
                <ul className="flex list-disc flex-col gap-[var(--space-1)] pl-[var(--space-5)]">
                  {applicable.map((change) => (
                    <li key={change.id} className="text-mono text-[length:var(--text-small)]">
                      {change.original} → {change.proposed}
                    </li>
                  ))}
                </ul>
                <span>Moves are recorded in operation history and can be undone where the filesystem allows.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
            <AlertDialogAction asChild><Button onClick={() => onApply(applicable)}>Apply</Button></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
