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

/**
 * Long-running task view: progress, current operation, elapsed time, cancel.
 * Uses a local token-based bar; swap in the shared ProgressBar once Phase 2
 * lands. Clearly distinguishes measurable from indeterminate progress.
 */
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
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={measurable ? Math.round(progress) : undefined}
            aria-label={title}
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary"
          >
            {measurable ? (
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-panel)] ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-caption)] text-muted">
              {measurable ? `${Math.round(progress)}%` : "Working..."}
            </span>
            {elapsed && (
              <span className="text-[length:var(--text-caption)] text-muted">
                Elapsed {elapsed}
              </span>
            )}
          </div>
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
