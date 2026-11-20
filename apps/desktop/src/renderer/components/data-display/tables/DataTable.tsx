import { useMemo, useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsLeft, ChevronsRight, Columns3 } from "lucide-react";
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui";
import { EmptyState, Skeleton } from "@/components/data-display/feedback";
import { cn } from "@/lib/utils";

export interface DataTableProps<T> {
  data: T[];
  /** Value type is intentionally loose so typed accessor columns are accepted. */
  columns: ColumnDef<T, any>[];
  getRowId?: (row: T, index: number) => string;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  pageSize?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Sortable, filterable, selectable table with column visibility and pagination.
 * Props `data`/`columns` come from TanStack Query, not local duplicated state.
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  selectedIds,
  onSelectionChange,
  loading = false,
  emptyState,
  pageSize = 25,
  compact = false,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set());
  const selection = selectedIds ?? internalSelection;

  const tableColumns = useMemo<ColumnDef<T, any>[]>(() => {
    const selectColumn: ColumnDef<T, any> = {
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(value === true)
          }
          aria-label="Select all rows on page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selection.has(String(row.id))}
          onCheckedChange={(value) => toggleRow(String(row.id), value === true)}
          aria-label="Select row"
          onClick={(event) => event.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };
    return [selectColumn, ...columns];

    function toggleRow(id: string, checked: boolean) {
      const next = new Set(selection);
      if (checked) next.add(id);
      else next.delete(id);
      if (selectedIds === undefined) setInternalSelection(next);
      onSelectionChange?.(next);
    }
  }, [columns, selection, selectedIds, onSelectionChange]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: getRowId ? (row, index) => getRowId(row, index) : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("flex flex-col gap-[var(--space-3)]", className)}>
      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 size={14} aria-hidden="true" /> Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(value === true)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {String(column.columnDef.header ?? column.id)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-border bg-surface">
        <table className="w-full border-collapse text-left text-[length:var(--text-body)]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-surface-secondary">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "whitespace-nowrap px-[var(--space-3)] font-medium text-muted",
                      compact ? "h-[var(--row-height-compact)]" : "h-[var(--row-height-comfortable)]",
                    )}
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-[var(--space-1)] hover:text-foreground"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" ? (
                          <ArrowUp size={12} aria-hidden="true" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowDown size={12} aria-hidden="true" />
                        ) : null}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {table.getVisibleLeafColumns().map((column) => (
                    <td key={column.id} className="px-[var(--space-3)] py-[var(--space-2)]">
                      <Skeleton width="70%" height="14px" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length}>
                  {emptyState ?? (
                    <EmptyState heading="No results" description="Try adjusting your filters." />
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors duration-[var(--duration-hover)] hover:bg-surface-secondary",
                    compact ? "h-[var(--row-height-compact)]" : "h-[var(--row-height-comfortable)]",
                    selection.has(row.id) && "bg-accent/10",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-[var(--space-3)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-[var(--space-3)] text-[length:var(--text-small)] text-muted">
        <span className="tabular-nums">
          {table.getFilteredRowModel().rows.length} rows
        </span>
        <div className="flex items-center gap-[var(--space-2)]">
          <span className="tabular-nums">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="First page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
          >
            <ChevronsLeft size={14} aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous page"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            <ArrowUp size={14} className="rotate-90" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            <ArrowDown size={14} className="rotate-90" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Last page"
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          >
            <ChevronsRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
