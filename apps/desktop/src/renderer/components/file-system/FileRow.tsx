import { Checkbox, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui";
import { DateDisplay, FileSize, StatusBadge } from "@/components/data-display";
import { cn } from "@/lib/utils";
import type { FileEntry } from "@/types";
import { FileIcon } from "./FileIcon";

export interface FileRowProps {
  file: FileEntry;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onOpen?: () => void;
  onCopyPath?: () => void;
  onInspect?: () => void;
  onDelete?: () => void;
  compact?: boolean;
  className?: string;
}

export function FileRow({
  file,
  selected = false,
  onSelectChange,
  onOpen,
  onCopyPath,
  onInspect,
  onDelete,
  compact = false,
  className,
}: FileRowProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          role="row"
          aria-selected={selected}
          className={cn(
            "flex w-full items-center gap-[var(--space-3)] border-b border-border px-[var(--space-3)] text-[length:var(--text-body)] transition-colors duration-[var(--duration-hover)] hover:bg-surface-secondary",
            compact ? "h-[var(--row-height-compact)]" : "h-[var(--row-height-comfortable)]",
            selected && "bg-accent/10",
            onOpen && "cursor-pointer",
            className,
          )}
          onDoubleClick={onOpen}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Select ${file.name}`}
          />
          <FileIcon name={file.name} />
          <span className="min-w-0 flex-1 truncate" title={file.path}>
            {file.name}
          </span>
          <span className="hidden min-w-0 flex-1 truncate text-[length:var(--text-small)] text-muted md:block" title={file.path}>
            {file.path}
          </span>
          <span className="w-24 shrink-0 text-right tabular-nums text-muted">
            <FileSize bytes={file.sizeBytes} />
          </span>
          <span className="hidden w-32 shrink-0 text-right text-muted lg:block">
            <DateDisplay value={file.modifiedAt} />
          </span>
          <span className="w-24 shrink-0 text-right">
            {file.status && <StatusBadge status={file.status} />}
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onOpen}>Open</ContextMenuItem>
        <ContextMenuItem onSelect={onCopyPath}>Copy path</ContextMenuItem>
        <ContextMenuItem onSelect={onInspect}>Inspect details</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem destructive onSelect={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
