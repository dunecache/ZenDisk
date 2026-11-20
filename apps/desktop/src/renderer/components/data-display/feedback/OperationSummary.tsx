import { FileSize } from "../metrics/FileSize";
import { cn } from "@/lib/utils";

export interface OperationSummaryData {
  completed: number;
  failed: number;
  skipped: number;
  total: number;
  reclaimedBytes: number;
}

export interface OperationSummaryProps {
  data: OperationSummaryData;
  className?: string;
}

/** Results of a batch operation: counts and reclaimed space. */
export function OperationSummary({ data, className }: OperationSummaryProps) {
  const items = [
    { label: "Completed", value: data.completed },
    { label: "Failed", value: data.failed },
    { label: "Skipped", value: data.skipped },
    { label: "Total affected", value: data.total },
  ];

  return (
    <div className={cn("flex flex-col gap-[var(--space-4)]", className)}>
      <dl className="grid grid-cols-2 gap-[var(--space-3)] sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-md)] border border-border bg-surface p-[var(--space-3)]">
            <dt className="text-[length:var(--text-small)] text-muted">{item.label}</dt>
            <dd className="text-[length:var(--text-metric)] font-semibold tabular-nums">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-success/10 px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-body)] text-success">
        <span>Space reclaimed</span>
        <strong className="tabular-nums">
          <FileSize bytes={data.reclaimedBytes} />
        </strong>
      </div>
    </div>
  );
}
