import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui";
import { Button } from "@/components/ui";
import { FileSize } from "@/components/data-display";
import type { DuplicateFile } from "@/types";

export interface QuarantineDialogProps {
  files: DuplicateFile[];
  onConfirm: () => void;
}

/** Moves selected copies to quarantine — recoverable, never an auto-delete. */
export function QuarantineDialog({ files, onConfirm }: QuarantineDialogProps) {
  const bytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={files.length === 0}>Quarantine selected</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Quarantine duplicate copies</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-[var(--space-2)]">
              <span>
                {files.length} files (<FileSize bytes={bytes} />) will be moved to a quarantine folder:
              </span>
              <ul className="list-disc pl-[var(--space-5)]">
                {files.map((file) => (
                  <li key={file.id} className="text-mono text-[length:var(--text-small)]">{file.path}/{file.name}</li>
                ))}
              </ul>
              <span>At least one copy in every group is kept. This action can be reversed.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
          <AlertDialogAction asChild><Button onClick={onConfirm}>Move to quarantine</Button></AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
