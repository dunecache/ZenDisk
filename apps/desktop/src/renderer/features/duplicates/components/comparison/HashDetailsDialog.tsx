import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import type { DuplicateGroup } from "@/types";

export interface HashDetailsDialogProps {
  group: DuplicateGroup | null;
  onClose: () => void;
}

export function HashDetailsDialog({ group, onClose }: HashDetailsDialogProps) {
  return (
    <Dialog open={group !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Content hash</DialogTitle>
          <DialogDescription>Verified by content, not just filename.</DialogDescription>
        </DialogHeader>
        {group && (
          <ul className="flex flex-col gap-[var(--space-2)]">
            {group.files.map((file) => (
              <li key={file.id} className="flex flex-col gap-[var(--space-1)] border-b border-border pb-[var(--space-2)] last:border-0">
                <span className="text-[length:var(--text-body)]">{file.name}</span>
                <span className="break-all text-mono text-[length:var(--text-small)] text-muted">
                  {file.hash ?? "Hash unavailable"}
                </span>
                <span className="text-mono text-[length:var(--text-caption)] text-muted">{file.path}</span>
              </li>
            ))}
          </ul>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
