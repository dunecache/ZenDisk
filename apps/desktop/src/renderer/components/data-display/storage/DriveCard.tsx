import { Card } from "@/components/layout";
import { FileSize } from "../metrics/FileSize";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

export interface DriveCardProps {
  name: string;
  letter?: string;
  type?: string;
  filesystem?: string;
  capacity: number;
  free: number;
  onClick?: () => void;
  className?: string;
}

export function DriveCard({
  name,
  letter,
  type,
  filesystem,
  capacity,
  free,
  onClick,
  className,
}: DriveCardProps) {
  const used = Math.max(0, capacity - free);
  const percent = capacity > 0 ? (used / capacity) * 100 : 0;
  const state = percent >= 90 ? "danger" : percent >= 75 ? "warning" : "default";
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full text-left",
        onClick && "transition-colors duration-[var(--duration-hover)] hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]",
        className,
      )}
    >
      <Card className={cn("flex flex-col gap-[var(--space-3)]", onClick && "border-border")}>
        <div className="flex items-center justify-between gap-[var(--space-2)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <span className="text-[length:var(--text-h3)] font-semibold">{name}</span>
            {letter && (
              <span className="rounded-[var(--radius-xs)] bg-muted-background px-[var(--space-2)] text-[length:var(--text-caption)] text-muted">
                {letter}
              </span>
            )}
          </div>
          {(type || filesystem) && (
            <span className="text-[length:var(--text-caption)] text-muted">
              {[type, filesystem].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>

        <ProgressBar value={used} max={capacity} state={state} />

        <div className="flex items-center justify-between text-[length:var(--text-small)] text-muted">
          <span>
            <FileSize bytes={free} /> free
          </span>
          <span className="tabular-nums">{Math.round(percent)}% used</span>
        </div>
        <div className="text-[length:var(--text-caption)] text-muted">
          <FileSize bytes={capacity} /> total
        </div>
      </Card>
    </Wrapper>
  );
}
