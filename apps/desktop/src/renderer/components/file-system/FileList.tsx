import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui";
import { EmptyState, SearchInput } from "@/components/data-display";
import { cn } from "@/lib/utils";
import type { FileEntry } from "@/types";
import { FileRow } from "./FileRow";
import { BulkActionToolbar } from "./BulkActionToolbar";

type SortKey = "name" | "size" | "modified";
type SortDirection = "asc" | "desc";

export interface FileListProps {
  files: FileEntry[];
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onOpen?: (file: FileEntry) => void;
  onCopyPath?: (file: FileEntry) => void;
  onInspect?: (file: FileEntry) => void;
  onDelete?: (files: FileEntry[]) => void;
  bulkActions?: React.ReactNode;
  emptyMessage?: string;
  compact?: boolean;
  className?: string;
}

/** Sortable, searchable, multi-select file list with context menus. */
export function FileList({
  files,
  selectedIds,
  onSelectionChange,
  onOpen,
  onCopyPath,
  onInspect,
  onDelete,
  bulkActions,
  emptyMessage = "No files found",
  compact = false,
  className,
}: FileListProps) {
  const [internalSelection, setInternalSelection] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const selection = selectedIds ?? internalSelection;

  const setSelection = (next: Set<string>) => {
    if (selectedIds === undefined) setInternalSelection(next);
    onSelectionChange?.(next);
  };

  const toggle = (id: string, selected: boolean) => {
    const next = new Set(selection);
    if (selected) next.add(id);
    else next.delete(id);
    setSelection(next);
  };

  const visibleFiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? files.filter((file) => file.name.toLowerCase().includes(normalized))
      : [...files];

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "name") comparison = a.name.localeCompare(b.name);
      if (sortKey === "size") comparison = a.sizeBytes - b.sizeBytes;
      if (sortKey === "modified") comparison = a.modifiedAt.localeCompare(b.modifiedAt);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [files, query, sortKey, sortDirection]);

  const sortBy = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortHeader = (key: SortKey, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => sortBy(key)}
      className="-ml-[var(--space-2)] gap-[var(--space-1)] text-[length:var(--text-small)] text-muted"
    >
      {label}
      {sortKey === key &&
        (sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </Button>
  );

  const allVisibleSelected =
    visibleFiles.length > 0 && visibleFiles.every((file) => selection.has(file.id));

  return (
    <div className={cn("flex flex-col gap-[var(--space-3)]", className)}>
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <SearchInput value={query} onChange={setQuery} placeholder="Search files" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = new Set(selection);
            if (allVisibleSelected) visibleFiles.forEach((file) => next.delete(file.id));
            else visibleFiles.forEach((file) => next.add(file.id));
            setSelection(next);
          }}
        >
          {allVisibleSelected ? "Deselect all" : "Select all"}
        </Button>
      </div>

      <BulkActionToolbar
        count={selection.size}
        onClear={() => setSelection(new Set())}
      >
        {bulkActions}
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              onDelete(files.filter((file) => selection.has(file.id)))
            }
          >
            Delete
          </Button>
        )}
      </BulkActionToolbar>

      <div className="overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
        <div className="flex h-[var(--row-height-compact)] items-center gap-[var(--space-3)] border-b border-border bg-surface-secondary px-[var(--space-3)]">
          <span className="w-4" />
          <span className="min-w-0 flex-1">{sortHeader("name", "Name")}</span>
          <span className="hidden min-w-0 flex-1 md:block">Location</span>
          <span className="w-24 shrink-0 text-right">{sortHeader("size", "Size")}</span>
          <span className="hidden w-32 shrink-0 text-right lg:block">
            {sortHeader("modified", "Modified")}
          </span>
          <span className="w-24 shrink-0" />
        </div>

        {visibleFiles.length === 0 ? (
          <EmptyState heading={emptyMessage} description="Try a different search or scan again." />
        ) : (
          <div role="rowgroup">
            {visibleFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                compact={compact}
                selected={selection.has(file.id)}
                onSelectChange={(selected) => toggle(file.id, selected)}
                onOpen={() => onOpen?.(file)}
                onCopyPath={() => onCopyPath?.(file)}
                onInspect={() => onInspect?.(file)}
                onDelete={() => onDelete?.([file])}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
