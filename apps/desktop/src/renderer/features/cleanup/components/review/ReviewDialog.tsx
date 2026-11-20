import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { FileSize, InlineAlert } from "@/components/data-display";
import { FileList } from "@/components/file-system";
import type { CleanupCategory, CleanupFile } from "@/types";

export interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CleanupCategory[];
  onConfirm: () => void;
}

export function ReviewDialog({ open, onOpenChange, categories, onConfirm }: ReviewDialogProps) {
  const files: CleanupFile[] = categories.flatMap((category) => category.files);
  const warnings = categories.filter((category) => category.warning);
  const bytes = categories.reduce((sum, category) => sum + category.bytes, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review cleanup</DialogTitle>
          <DialogDescription>
            Inspect the exact files before proceeding. Nothing is deleted until you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[var(--space-3)]">
          {warnings.map((category) => (
            <InlineAlert key={category.id} variant="warning" title={category.name}>
              {category.warning}
            </InlineAlert>
          ))}
          <FileList files={files.map((file) => ({
            id: file.id,
            name: file.name,
            path: file.path,
            sizeBytes: file.sizeBytes,
            modifiedAt: file.modifiedAt,
            isDirectory: false,
          }))} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Back</Button>
          <ConfirmDialog
            categories={categories}
            bytes={bytes}
            fileCount={files.length}
            onConfirm={() => {
              onOpenChange(false);
              onConfirm();
            }}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({ categories, bytes, fileCount, onConfirm }: {
  categories: CleanupCategory[];
  bytes: number;
  fileCount: number;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete {fileCount} files</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm permanent deletion</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="flex flex-col gap-[var(--space-2)]">
              <span>
                This will permanently delete <strong>{fileCount} files</strong> totaling{" "}
                <strong><FileSize bytes={bytes} /></strong> from:
              </span>
              <ul className="list-disc pl-[var(--space-5)]">
                {categories.map((category) => (
                  <li key={category.id}>{category.name} — {category.fileCount} files</li>
                ))}
              </ul>
              <span className="text-danger">Recovery is not possible. Files will not be moved to the recycle bin.</span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild><Button variant="outline">Cancel</Button></AlertDialogCancel>
          <AlertDialogAction asChild><Button variant="destructive" onClick={onConfirm}>Delete permanently</Button></AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
