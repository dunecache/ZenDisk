import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { InlineAlert, StatusBadge } from "@/components/data-display";
import { Card } from "@/components/layout";
import type { StartupEntry } from "@/types";

const impactLabel = { high: "High impact", medium: "Medium impact", low: "Low impact" } as const;

export interface StartupListProps {
  entries: StartupEntry[];
}

export function StartupList({ entries }: StartupListProps) {
  const [details, setDetails] = useState<StartupEntry | null>(null);

  return (
    <>
      <Card className="p-0">
        <ul>
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-[var(--space-3)] border-b border-border px-[var(--space-5)] py-[var(--space-3)] last:border-0"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[length:var(--text-body)] font-medium">{entry.name}</span>
                <span className="truncate text-[length:var(--text-small)] text-muted">
                  {entry.publisher}
                </span>
              </span>
              <span className="hidden shrink-0 text-[length:var(--text-small)] text-muted sm:inline">
                {impactLabel[entry.impact]}
              </span>
              <StatusBadge
                status={entry.enabled ? "healthy" : "paused"}
                label={entry.enabled ? "Enabled" : "Disabled"}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton label={`Actions for ${entry.name}`} variant="ghost">
                    <MoreHorizontal size={16} aria-hidden="true" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setDetails(entry)}>
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>Disable at startup</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    Startup changes require native access (not connected yet).
                  </DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </Card>

      <Dialog open={details !== null} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{details?.name ?? "Startup entry"}</DialogTitle>
            <DialogDescription>Details of the startup entry.</DialogDescription>
          </DialogHeader>
          <dl className="grid grid-cols-[auto_1fr] gap-x-[var(--space-4)] gap-y-[var(--space-2)] text-[length:var(--text-body)]">
            <dt className="text-muted">Publisher</dt>
            <dd>{details?.publisher}</dd>
            <dt className="text-muted">Status</dt>
            <dd>
              <StatusBadge
                status={details?.enabled ? "healthy" : "paused"}
                label={details?.enabled ? "Enabled" : "Disabled"}
              />
            </dd>
            <dt className="text-muted">Impact</dt>
            <dd>{details ? impactLabel[details.impact] : "—"}</dd>
            <dt className="text-muted">Command</dt>
            <dd className="text-mono break-all">{details?.path}</dd>
            <dt className="text-muted">Source</dt>
            <dd>{details?.source}</dd>
          </dl>
          <InlineAlert variant="info" title="Preview only">
            Changing startup entries requires native permission and is not available yet.
            No changes have been made.
          </InlineAlert>
        </DialogContent>
      </Dialog>
    </>
  );
}
