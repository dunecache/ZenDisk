import { FileSize } from "@/components/data-display";
import { Checkbox as CheckboxControl } from "@/components/ui";
import { FileIcon } from "@/components/file-system";
import { Card } from "@/components/layout";
import type { DuplicateGroup } from "@/types";

export interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  selected: Set<string>;
  onToggle: (fileId: string, selected: boolean) => void;
  onShowHash?: (group: DuplicateGroup) => void;
}

export function DuplicateGroupCard({ group, selected, onToggle, onShowHash }: DuplicateGroupCardProps) {
  const bytes = group.files[0]?.sizeBytes ?? 0;

  return (
    <Card className="flex flex-col gap-[var(--space-2)]">
      <div className="flex items-center justify-between gap-[var(--space-2)]">
        <span className="text-[length:var(--text-h3)] font-semibold">
          {group.files.length} copies · <FileSize bytes={bytes} /> each
        </span>
        {group.hash && onShowHash && (
          <button
            type="button"
            className="text-[length:var(--text-small)] text-primary hover:underline"
            onClick={() => onShowHash(group)}
          >
            Show hash
          </button>
        )}
      </div>
      <ul className="flex flex-col">
        {group.files.map((file) => (
          <li key={file.id} className="flex items-center gap-[var(--space-3)] border-b border-border py-[var(--space-2)] last:border-0">
            <CheckboxControl
              className="shrink-0"
              checked={selected.has(file.id)}
              onCheckedChange={(checked) => onToggle(file.id, checked === true)}
              aria-label={`Select ${file.name} in ${file.path}`}
            />
            <FileIcon name={file.name} />
            <span className="min-w-0 flex-1 truncate" title={file.path}>{file.name}</span>
            <span className="hidden shrink-0 text-[length:var(--text-small)] text-muted sm:block">{file.path}</span>
            <span className="shrink-0 tabular-nums text-[length:var(--text-small)] text-muted">
              <FileSize bytes={file.sizeBytes} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
