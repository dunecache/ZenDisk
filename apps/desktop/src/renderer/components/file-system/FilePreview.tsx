import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/data-display";
import { cn } from "@/lib/utils";

export interface FilePreviewProps {
  name: string;
  /** Data URL or object URL from a trusted, explicit preview operation. */
  src?: string;
  mimeType?: string;
  isDirectory?: boolean;
  className?: string;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

/**
 * Preview for explicitly supported formats only.
 * Never renders arbitrary file content as trusted HTML.
 */
export function FilePreview({
  name,
  src,
  mimeType,
  isDirectory = false,
  className,
}: FilePreviewProps) {
  if (isDirectory || !src || !mimeType || !IMAGE_TYPES.includes(mimeType)) {
    return (
      <EmptyState
        className={className}
        icon={<FileQuestion size={24} />}
        heading="No preview available"
        description="This file type cannot be previewed safely. Open it with an external application instead."
      />
    );
  }

  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-muted-background p-[var(--space-4)]", className)}>
      <img
        src={src}
        alt={`Preview of ${name}`}
        className="max-h-80 max-w-full object-contain"
      />
    </div>
  );
}
