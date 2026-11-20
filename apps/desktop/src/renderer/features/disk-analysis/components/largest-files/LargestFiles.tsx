import { useMemo } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Card } from "@/components/layout";
import { DataTable, DateDisplay, FileSize } from "@/components/data-display";
import { FileIcon } from "@/components/file-system";
import type { DiskEntry } from "@/types";

export interface LargestFilesProps {
  files: DiskEntry[];
}

const helper = createColumnHelper<DiskEntry>();

export function LargestFiles({ files }: LargestFilesProps) {
  const columns = useMemo(
    () => [
      helper.accessor("name", {
        header: "Name",
        cell: (info) => (
          <span className="flex items-center gap-[var(--space-2)]">
            <FileIcon name={info.getValue()} />
            <span className="truncate" title={info.row.original.path}>{info.getValue()}</span>
          </span>
        ),
      }),
      helper.accessor("path", { header: "Location", cell: (info) => <span className="truncate text-muted">{info.getValue()}</span> }),
      helper.accessor("sizeBytes", {
        header: "Size",
        cell: (info) => <FileSize bytes={info.getValue()} />,
      }),
      helper.accessor("modifiedAt", {
        header: "Modified",
        cell: (info) => <DateDisplay value={info.getValue()} />,
      }),
    ],
    [],
  );

  return (
    <Card className="flex flex-col gap-[var(--space-3)]">
      <h3 className="text-[length:var(--text-h3)] font-semibold">Largest files</h3>
      <DataTable
        data={files}
        columns={columns}
        getRowId={(row) => row.id}
        pageSize={5}
        compact
      />
    </Card>
  );
}
