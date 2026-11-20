import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, DateDisplay, EmptyState, FileSize, FilterBar, SearchInput } from "@/components/data-display";
import type { InstalledApplication } from "@/types";

export interface ApplicationsTableProps {
  applications: InstalledApplication[];
}

export function ApplicationsTable({ applications }: ApplicationsTableProps) {
  const [query, setQuery] = useState("");

  const columns = useMemo<ColumnDef<InstalledApplication, any>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Application",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      { accessorKey: "publisher", header: "Publisher" },
      { accessorKey: "version", header: "Version" },
      {
        accessorKey: "installedAt",
        header: "Installed",
        cell: ({ getValue }) => <DateDisplay value={getValue<string>()} />,
      },
      {
        accessorKey: "estimatedBytes",
        header: "Estimated size",
        cell: ({ getValue }) => <FileSize bytes={getValue<number>()} />,
      },
    ],
    [],
  );

  const filtered = applications.filter((app) => {
    const text = query.trim().toLowerCase();
    return (
      text === "" ||
      app.name.toLowerCase().includes(text) ||
      app.publisher.toLowerCase().includes(text)
    );
  });

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <FilterBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Filter applications"
        />
      </FilterBar>
      <DataTable
        data={filtered}
        columns={columns}
        selectable={false}
        getRowId={(row) => row.id}
        emptyState={
          <EmptyState
            heading="No applications found"
            description="Try a different name or publisher."
          />
        }
      />
      <p className="text-[length:var(--text-small)] text-muted">
        Source: {applications[0]?.source ?? "Unknown"}. Sizes are estimates from
        the installation record.
      </p>
    </div>
  );
}
