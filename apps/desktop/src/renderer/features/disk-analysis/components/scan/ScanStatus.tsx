import { Pause, Play, RotateCw, Square } from "lucide-react";
import { Button } from "@/components/ui";
import { InlineAlert, StatusBadge } from "@/components/data-display";
import { formatBytes } from "@/lib/formatters";
import type { ScanSkippedLocation, ScanState, SkipCounts } from "@/types";

export interface ScanStatusProps {
  state: ScanState;
  isPartial?: boolean;
  budgetExceeded?: boolean;
  skipCounts?: SkipCounts;
  skippedLocations?: ScanSkippedLocation[];
  progress?: { scannedBytes: number; scannedItems: number } | null;
  onScan?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

const emptyCounts: SkipCounts = { unreadable: 0, excluded: 0, reparse: 0, budget: 0 };

export function ScanStatus({
  state,
  isPartial = false,
  budgetExceeded = false,
  skipCounts = emptyCounts,
  skippedLocations = [],
  progress,
  onScan,
  onPause,
  onResume,
  onCancel,
}: ScanStatusProps) {
  const running = state === "discovering" || state === "scanning" || state === "paused";
  const finished = state === "idle" || state === "completed" || state === "cancelled" || state === "failed" || state === "partial";
  const unreadableSamples = skippedLocations.filter((location) => location.kind === "unreadable");

  return (
    <div className="flex flex-col gap-[var(--space-2)]">
      <div className="flex items-center gap-[var(--space-2)]">
        <StatusBadge status={statusFor(state)} label={state === "partial" ? "Partial" : undefined} />
        {finished ? (
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

      {budgetExceeded && (
        <InlineAlert variant="info" title="Scan limited">
          The scan stopped at its item/time limit. Results cover the locations
          visited first; use Rescan after closing other heavy applications if
          you need a wider view.
        </InlineAlert>
      )}

      {isPartial && (
        <InlineAlert variant="warning" title="Partial results">
          {skipCounts.unreadable > 0 ? (
            <>
              {new Intl.NumberFormat().format(skipCounts.unreadable)} location
              {skipCounts.unreadable === 1 ? "" : "s"} could not be read. Results
              cover the rest of the drive.
              {unreadableSamples.length > 0 && (
                <details className="mt-[var(--space-2)] text-[length:var(--text-small)]">
                  <summary className="cursor-pointer text-muted">Show sampled paths</summary>
                  <ul className="mt-[var(--space-2)] flex flex-col gap-[var(--space-1)]">
                    {unreadableSamples.map((location) => (
                      <li key={location.path} className="break-all text-mono text-[length:var(--text-caption)]">
                        {location.path} — {location.reason}
                      </li>
                    ))}
                  </ul>
                  {skipCounts.unreadable > unreadableSamples.length && (
                    <p className="mt-[var(--space-1)] text-[length:var(--text-caption)] text-muted">
                      Showing {unreadableSamples.length} of {skipCounts.unreadable} unreadable locations.
                    </p>
                  )}
                </details>
              )}
            </>
          ) : (
            "Some locations could not be read. Results shown so far may not represent the whole drive."
          )}
        </InlineAlert>
      )}

      {(skipCounts.excluded > 0 || skipCounts.reparse > 0) && (
        <p className="text-[length:var(--text-small)] text-muted">
          Excluded by design: {new Intl.NumberFormat().format(skipCounts.excluded)} protected folder
          {skipCounts.excluded === 1 ? "" : "s"}, {new Intl.NumberFormat().format(skipCounts.reparse)} link
          {skipCounts.reparse === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}

function statusFor(state: ScanState) {
  switch (state) {
    case "completed": return "completed";
    case "partial": return "warning";
    case "failed": return "failed";
    case "cancelled": return "paused";
    case "paused": return "paused";
    case "discovering":
    case "scanning": return "running";
    default: return "healthy";
  }
}
