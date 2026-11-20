import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Card } from "@/components/layout";
import { DataTable, FileSize, DateDisplay } from "@/components/data-display";
import { FileIcon } from "@/components/file-system";
import type { DiskEntry } from "@/types";

export interface LargestFoldersProps {
  folders: DiskEntry[];
}

const helper = createColumnHelper<DiskEntry>();

export function LargestFolders({ folders }: LargestFoldersProps) {
  const columns = useMemo(
    () => [
      helper.accessor("name", {
        header: "Folder",
        cell: (info) => (
          <span className="flex items-center gap-[var(--space-2)]">
            <FileIcon name={info.getValue()} isDirectory />
            <span className="truncate">{info.getValue()}</span>
          </span>
        ),
      }),
      helper.accessor("path", { header: "Location", cell: (info) => <span className="truncate text-muted">{info.getValue()}</span> }),
      helper.accessor("sizeBytes", { header: "Size", cell: (info) => <FileSize bytes={info.getValue()} /> }),
      helper.accessor("modifiedAt", { header: "Modified", cell: (info) => <DateDisplay value={info.getValue()} /> }),
    ],
    [],
  );

  return (
    <Card className="flex flex-col gap-[var(--space-3)]">
      <h3 className="text-[length:var(--text-h3)] font-semibold">Largest folders</h3>
      <DataTable
        data={folders}
        columns={columns}
        getRowId={(row) => row.id}
        pageSize={5}
        compact
      />
    </Card>
  );
}
