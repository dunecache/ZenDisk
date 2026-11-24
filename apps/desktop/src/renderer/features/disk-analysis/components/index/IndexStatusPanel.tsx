import { Database, RefreshCw, RotateCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { InlineAlert, StatusBadge } from "@/components/data-display";
import { formatBytes } from "@/lib/formatters";
import type {
  NativeIndexProgress,
  NativeIndexStats,
  NativeIndexStatus,
} from "@/lib/native/client";

export interface IndexStatusPanelProps {
  status: NativeIndexStatus | null;
  stats: NativeIndexStats | null;
  progress: NativeIndexProgress | null;
  onUpdate: () => void;
  onFullRescan: () => void;
  onReconcile: () => void;
}

const integer = new Intl.NumberFormat();

function badgeFor(status: NativeIndexStatus | null) {
  if (!status) return "healthy" as const;
  if (status.status === "partial") return "warning" as const;
  if (status.status === "cancelled") return "paused" as const;
  if (status.status === "fresh") return "completed" as const;
  return "healthy" as const;
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <span className="text-[length:var(--text-caption)] text-muted">{label}</span>
      <span className="text-[length:var(--text-large)] tabular-nums">{integer.format(value)}</span>
    </div>
  );
}

/**
 * Aggregated, explainable view of the persistent index. Every skip and deferral
 * is counted; nothing is silently discarded.
 */
export function IndexStatusPanel({
  status,
  stats,
  progress,
  onUpdate,
  onFullRescan,
  onReconcile,
}: IndexStatusPanelProps) {
  const counts = status?.counts;
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <StatusBadge
          status={badgeFor(status)}
          label={status?.fresh ? "Index up to date" : status?.status ?? "Index not built"}
        />
        <Button size="sm" variant="outline" onClick={onUpdate}>
          <RefreshCw size={14} aria-hidden="true" /> Update index
        </Button>
        <Button size="sm" variant="ghost" onClick={onFullRescan}>
          <RotateCw size={14} aria-hidden="true" /> Full rescan
        </Button>
        <Button size="sm" variant="ghost" onClick={onReconcile}>
          <ShieldCheck size={14} aria-hidden="true" /> Reconcile
        </Button>
      </div>

      {status?.needsReconciliation && (
        <InlineAlert variant="warning" title="Change watcher overflow">
          Some filesystem notifications were dropped. A full reconciliation is
          required before the index can be trusted as current.
        </InlineAlert>
      )}
      {status?.budgetExceeded && (
        <InlineAlert variant="info" title="More work queued">
          This pass reached its time or item budget. Pending directories remain
          checkpointed; the next update continues from where this one stopped.
        </InlineAlert>
      )}

      {progress && (
        <p className="text-[length:var(--text-small)] text-muted tabular-nums">
          {progress.phase}: {integer.format(progress.counts.discovered)} entries examined ·{" "}
          {integer.format(progress.counts.unchanged)} unchanged ·{" "}
          {integer.format(progress.counts.analyzeScheduled)} queued for analysis
        </p>
      )}

      <div className="grid gap-[var(--space-4)] desktop:grid-cols-4">
        <Count label="Discovered" value={counts?.discovered ?? stats?.totalFiles ?? 0} />
        <Count label="Newly indexed" value={counts?.new ?? 0} />
        <Count label="Unchanged (skipped)" value={counts?.unchanged ?? 0} />
        <Count label="Metadata verified" value={counts?.metadataVerified ?? 0} />
        <Count label="Queued for analysis" value={status?.pendingWork ?? stats?.pendingWork ?? 0} />
        <Count label="Analyzed" value={counts?.analyzed ?? 0} />
        <Count label="Ignored by rule" value={counts?.ignored ?? 0} />
        <Count label="Deferred (low priority)" value={counts?.deferred ?? 0} />
        <Count label="Failed" value={counts?.failed ?? 0} />
        <Count label="Moved" value={counts?.moved ?? 0} />
        <Count label="Missing" value={counts?.missing ?? 0} />
        <Count label="Directories pending" value={status?.pendingDirs ?? 0} />
      </div>

      {status && (
        <p className="flex items-center gap-[var(--space-2)] text-[length:var(--text-caption)] text-muted">
          <Database size={14} aria-hidden="true" />
          Generation {integer.format(status.generation)} ·{" "}
          {integer.format(status.pendingDirs)} directories pending ·{" "}
          {formatBytes(stats?.totalBytes ?? 0)} indexed
        </p>
      )}
    </div>
  );
}
