import {
  formatDate,
  formatExactTimestamp,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";

export interface DateDisplayProps {
  value: Date | string | number;
  className?: string;
}

/** Human-friendly date with an exact timestamp in a tooltip. */
export function DateDisplay({ value, className }: DateDisplayProps) {
  const date = value instanceof Date ? value : new Date(value);
  const valid = !Number.isNaN(date.getTime());
  const exact = formatExactTimestamp(value);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <time
          dateTime={valid ? date.toISOString() : undefined}
          className={cn("whitespace-nowrap tabular-nums", className)}
        >
          {formatDate(value)}
        </time>
      </TooltipTrigger>
      <TooltipContent>{exact}</TooltipContent>
    </Tooltip>
  );
}
