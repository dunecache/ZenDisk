import { Copy } from "lucide-react";
import { Button, Separator } from "@/components/ui";
import { DateDisplay, FileSize } from "@/components/data-display";
import { toast } from "@/stores";
import type { FileEntry } from "@/types";
import { FileIcon } from "./FileIcon";

export interface FileDetailsPanelProps {
  file: FileEntry;
  /** Optional hash, shown when available. */
  hash?: string;
  createdAt?: string;
  attributes?: string[];
  className?: string;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[var(--space-1)]">
      <dt className="text-[length:var(--text-caption)] text-muted">{label}</dt>
      <dd className="break-all text-[length:var(--text-body)]">{children}</dd>
    </div>
  );
}

/** Full file metadata. Never renders arbitrary file content. */
export function FileDetailsPanel({
  file,
  hash,
  createdAt,
  attributes,
  className,
}: FileDetailsPanelProps) {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "—";

  return (
    <div className={className}>
      <div className="mb-[var(--space-4)] flex items-center gap-[var(--space-3)]">
        <FileIcon name={file.name} isDirectory={file.isDirectory} size={20} />
        <span className="truncate text-[length:var(--text-h3)] font-semibold">{file.name}</span>
      </div>
      <Separator className="mb-[var(--space-4)]" />

      <dl className="flex flex-col gap-[var(--space-4)]">
        <DetailRow label="Full path">
          <span className="text-mono">{file.path}</span>
          <Button
            variant="ghost"
            size="xs"
            className="mt-[var(--space-1)] self-start"
            onClick={() => {
              void navigator.clipboard?.writeText(file.path).then(
                () => toast.success("Path copied"),
                () => toast.error("Could not copy path"),
              );
            }}
          >
            <Copy size={12} aria-hidden="true" /> Copy
          </Button>
        </DetailRow>
        <DetailRow label="Extension">{extension}</DetailRow>
        <DetailRow label="Size">
          <FileSize bytes={file.sizeBytes} />
        </DetailRow>
        {createdAt && (
          <DetailRow label="Created"><DateDisplay value={createdAt} /></DetailRow>
        )}
        <DetailRow label="Modified"><DateDisplay value={file.modifiedAt} /></DetailRow>
        {attributes && attributes.length > 0 && (
          <DetailRow label="Attributes">{attributes.join(", ")}</DetailRow>
        )}
        {hash && (
          <DetailRow label="Hash">
            <span className="text-mono">{hash}</span>
          </DetailRow>
        )}
      </dl>
    </div>
  );
}
