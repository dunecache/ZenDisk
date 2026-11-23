import { Pause, Play, RotateCw, Square } from "lucide-react";
import { Button } from "@/components/ui";
import { InlineAlert, StatusBadge } from "@/components/data-display";
import { formatBytes } from "@/lib/formatters";
import type { ScanState } from "@/types";

export interface ScanStatusProps {
  state: ScanState;
  isPartial?: boolean;
  progress?: { scannedBytes: number; scannedItems: number } | null;
  onScan?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export function ScanStatus({
  state,
  isPartial = false,
  progress,
  onScan,
  onPause,
  onResume,
  onCancel,
}: ScanStatusProps) {
  const running = state === "discovering" || state === "scanning";

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <StatusBadge status={statusFor(state)} />
        {state === "idle" || state === "completed" || state === "cancelled" || state === "failed" ? (
          <Button size="sm" onClick={onScan}>
            <RotateCw size={14} aria-hidden="true" />
            {state === "idle" ? "Scan" : "Rescan"}
          </Button>
        ) : null}
        {state === "scanning" && (
          <Button size="sm" variant="outline" onClick={onPause}>
            <Pause size={14} aria-hidden="true" /> Pause
          </Button>
        )}
        {state === "paused" && (
          <Button size="sm" variant="outline" onClick={onResume}>
            <Play size={14} aria-hidden="true" /> Resume
          </Button>
        )}
        {running && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <Square size={14} aria-hidden="true" /> Cancel
          </Button>
        )}
      </div>
      {progress && (
        <p className="text-[length:var(--text-small)] text-muted tabular-nums">
          Scanned {new Intl.NumberFormat().format(progress.scannedItems)} items · {formatBytes(progress.scannedBytes)}
        </p>
      )}
      {isPartial && (
        <InlineAlert variant="warning" title="Partial results">
          The scan is incomplete. Results shown so far may not represent the whole drive.
        </InlineAlert>
      )}
    </div>
  );
}

function statusFor(state: ScanState) {
  switch (state) {
    case "completed": return "completed";
    case "failed": return "failed";
    case "paused": return "paused";
    case "discovering":
    case "scanning": return "running";
    default: return "healthy";
  }
}
