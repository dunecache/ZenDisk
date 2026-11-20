import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { OperationSummary } from "@/components/data-display";
import type { OperationRecord } from "@/types";

export interface CleanupSummaryProps {
  record: OperationRecord | null;
  onClose: () => void;
}

export function CleanupSummary({ record, onClose }: CleanupSummaryProps) {
  return (
    <Dialog open={record !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cleanup complete</DialogTitle>
          <DialogDescription>The operation has been recorded in your history.</DialogDescription>
        </DialogHeader>
        {record && (
          <OperationSummary
            data={{
              completed: record.completed,
              failed: record.failed,
              skipped: record.skipped,
              total: record.total,
              reclaimedBytes: record.reclaimedBytes,
            }}
          />
        )}
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
