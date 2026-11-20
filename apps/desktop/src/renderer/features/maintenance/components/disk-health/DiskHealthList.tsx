import { InlineAlert, StatusBadge } from "@/components/data-display";
import { Card } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { DriveHealth } from "@/types";

export interface DiskHealthListProps {
  drives: DriveHealth[];
}

export function DiskHealthList({ drives }: DiskHealthListProps) {
  return (
    <div className="grid gap-[var(--space-4)] lg:grid-cols-2">
      {drives.map((drive) => {
        const unavailable = drive.attributes.filter((attribute) => !attribute.supported);
        return (
          <Card key={drive.driveId} className="flex flex-col gap-[var(--space-4)]">
            <div className="flex items-start justify-between gap-[var(--space-3)]">
              <div className="flex flex-col gap-[var(--space-1)]">
                <h3 className="text-[length:var(--text-h3)] font-semibold">
                  {drive.name}{" "}
                  <span className="text-[length:var(--text-body)] font-normal text-muted">
                    ({drive.driveId})
                  </span>
                </h3>
                <p className="text-[length:var(--text-small)] text-muted">{drive.summary}</p>
              </div>
              <StatusBadge status={drive.status} />
            </div>

            <dl className="flex flex-col">
              {drive.attributes.map((attribute) => (
                <div
                  key={attribute.id}
                  className="flex items-center justify-between gap-[var(--space-3)] border-b border-border py-[var(--space-2)] last:border-0"
                >
                  <dt className="text-[length:var(--text-body)]">{attribute.label}</dt>
                  <dd
                    className={cn(
                      "text-[length:var(--text-body)] tabular-nums",
                      !attribute.supported && "text-muted",
                    )}
                  >
                    {attribute.value}
                  </dd>
                </div>
              ))}
            </dl>

            {unavailable.length > 0 && (
              <InlineAlert variant="info" title="Some attributes are not reported">
                {unavailable
                  .map((attribute) => `${attribute.label}: ${attribute.note ?? "Not available."}`)
                  .join(" ")}
              </InlineAlert>
            )}

            <div className="flex flex-col gap-[var(--space-1)] text-[length:var(--text-small)] text-muted">
              <span>Source: {drive.source}</span>
              <ul className="list-disc pl-[var(--space-5)]">
                {drive.limitations.map((limitation) => (
                  <li key={limitation}>{limitation}</li>
                ))}
              </ul>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
