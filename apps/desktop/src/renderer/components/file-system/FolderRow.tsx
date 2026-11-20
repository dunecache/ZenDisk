import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger, IconButton } from "@/components/ui";
import { DateDisplay, FileSize } from "@/components/data-display";
import { cn } from "@/lib/utils";
import type { FileEntry } from "@/types";
import { FileIcon } from "./FileIcon";

export interface FolderRowProps {
  folder: FileEntry;
  depth?: number;
  expanded?: boolean;
  selected?: boolean;
  onToggleExpand?: () => void;
  onSelectChange?: (selected: boolean) => void;
  onAnalyze?: () => void;
  onOrganize?: () => void;
  onCopyPath?: () => void;
  onExclude?: () => void;
  compact?: boolean;
}

export function FolderRow({
  folder,
  depth = 0,
  expanded = false,
  selected = false,
  onToggleExpand,
  onSelectChange,
  onAnalyze,
  onOrganize,
  onCopyPath,
  onExclude,
  compact = false,
}: FolderRowProps) {
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
          )}
          style={{ paddingLeft: `calc(var(--space-3) + ${depth * 16}px)` }}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(checked === true)}
            aria-label={`Select ${folder.name}`}
          />
          <IconButton
            label={expanded ? "Collapse folder" : "Expand folder"}
            variant="ghost"
            onClick={onToggleExpand}
            className="h-6 w-6"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </IconButton>
          <FileIcon name={folder.name} isDirectory size={16} />
          <span className="min-w-0 flex-1 truncate" title={folder.path}>{folder.name}</span>
          <span className="w-24 shrink-0 text-right tabular-nums text-muted">
            <FileSize bytes={folder.sizeBytes} />
          </span>
          <span className="hidden w-32 shrink-0 text-right text-muted lg:block">
            <DateDisplay value={folder.modifiedAt} />
          </span>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={onAnalyze}>Analyze</ContextMenuItem>
        <ContextMenuItem onSelect={onOrganize}>Organize</ContextMenuItem>
        <ContextMenuItem onSelect={onCopyPath}>Copy path</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={onExclude}>Exclude from scans</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
