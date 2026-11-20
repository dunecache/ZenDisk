import { ChevronRight, Copy } from "lucide-react";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { cn } from "@/lib/utils";
import { toast } from "@/stores";

export interface BreadcrumbPathProps {
  /** Full path, e.g. "C:/Users/me/Documents". */
  path: string;
  /** Separator used in the path. Defaults to "/". */
  separator?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

/** Truncates long paths intelligently and allows copying the full path. */
export function BreadcrumbPath({
  path,
  separator = "/",
  onNavigate,
  className,
}: BreadcrumbPathProps) {
  const normalized = path.replace(/\\/g, "/");
  const segments = normalized.split(separator).filter(Boolean);
  const display = segments.length > 6
    ? [segments[0], "…", ...segments.slice(-4)]
    : segments;

  const fullPath = () => {
    void navigator.clipboard?.writeText(path).then(
      () => toast.success("Path copied"),
      () => toast.error("Could not copy path"),
    );
  };

  return (
    <nav aria-label="Path" className={cn("flex min-w-0 items-center gap-[var(--space-1)]", className)}>
      <ol className="flex min-w-0 items-center text-[length:var(--text-small)]">
        {display.map((segment, index) => (
          <li key={`${segment}-${index}`} className="flex min-w-0 items-center">
            {index > 0 && (
              <ChevronRight size={12} className="mx-[var(--space-1)] shrink-0 text-muted" aria-hidden="true" />
            )}
            {segment === "…" ? (
              <span className="text-muted" title={path}>…</span>
            ) : index === display.length - 1 ? (
              <span className="truncate font-medium" aria-current="page">{segment}</span>
            ) : (
              <button
                type="button"
                className="truncate text-muted hover:text-foreground hover:underline"
                onClick={() => {
                  const target = segments.slice(0, segments.indexOf(segment) + 1).join(separator);
                  onNavigate?.(separator === "/" ? `/${target}` : target);
                }}
              >
                {segment}
              </button>
            )}
          </li>
        ))}
      </ol>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton label="Copy full path" variant="ghost" onClick={fullPath}>
            <Copy size={14} aria-hidden="true" />
          </IconButton>
        </TooltipTrigger>
        <TooltipContent>Copy full path</TooltipContent>
      </Tooltip>
    </nav>
  );
}
