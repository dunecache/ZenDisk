import { LoaderCircle } from "lucide-react";
import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { ProgressBar } from "@/components/data-display";

export interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Current operation, e.g. "Scanning C:/Users". */
  operation?: string;
  /** 0..100 when measurable; omit for indeterminate work. */
  progress?: number;
  elapsed?: string;
  /** Allow cancellation only when the underlying operation supports it. */
  cancellable?: boolean;
  onCancel?: () => void;
}

/** Long-running task view: progress, current operation, elapsed time, cancel. */
export function ProgressDialog({
  open,
  onOpenChange,
  title,
  operation,
  progress,
  elapsed,
  cancellable = false,
  onCancel,
}: ProgressDialogProps) {
  const measurable = progress !== undefined;

  return (
    <Dialog open={open} onOpenChange={cancellable ? onOpenChange : undefined}>
      <DialogContent hideClose className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-[var(--space-2)]">
            <LoaderCircle size={16} className="animate-spin text-primary" aria-hidden="true" />
            {title}
          </DialogTitle>
          {operation && (
            <DialogDescription className="text-mono">{operation}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex flex-col gap-[var(--space-2)]">
          <ProgressBar
            value={measurable ? progress : undefined}
            max={100}
            indeterminate={!measurable}
            showLabel
            ariaLabel={title}
          />
          {elapsed && (
            <span className="text-[length:var(--text-caption)] text-muted">
              Elapsed {elapsed}
            </span>
          )}
        </div>

        {cancellable && (
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
