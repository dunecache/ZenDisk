import { formatBytes, type FormatBytesOptions } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface FileSizeProps extends FormatBytesOptions {
  bytes: number;
  className?: string;
}

/** Consistent byte formatting with tabular numbers for storage values. */
export function FileSize({ bytes, unit, precision, className }: FileSizeProps) {
  return (
    <span className={cn("whitespace-nowrap tabular-nums", className)}>
      {formatBytes(bytes, { unit, precision })}
    </span>
  );
}
