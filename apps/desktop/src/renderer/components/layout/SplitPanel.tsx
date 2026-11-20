import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SplitPanelProps {
  /** Left/top panel. */
  primary: ReactNode;
  /** Right/bottom panel. */
  secondary: ReactNode;
  direction?: "horizontal" | "vertical";
  /** Initial percentage size of the primary panel. */
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
}

/**
 * Resizable two-panel layout: rule list + editor, explorer + details.
 * Pointer-driven with a keyboard-accessible separator.
 */
export function SplitPanel({
  primary,
  secondary,
  direction = "horizontal",
  defaultSize = 40,
  minSize = 20,
  maxSize = 80,
  className,
}: SplitPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(defaultSize);
  const [dragging, setDragging] = useState(false);
  const isHorizontal = direction === "horizontal";

  const applyFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const percent = isHorizontal
      ? ((clientX - rect.left) / rect.width) * 100
      : ((clientY - rect.top) / rect.height) * 100;
    setSize(Math.min(maxSize, Math.max(minSize, percent)));
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (dragging) applyFromPointer(event.clientX, event.clientY);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const decrease = isHorizontal ? "ArrowLeft" : "ArrowUp";
    const increase = isHorizontal ? "ArrowRight" : "ArrowDown";
    if (event.key === decrease) {
      event.preventDefault();
      setSize((s) => Math.max(minSize, s - 2));
    } else if (event.key === increase) {
      event.preventDefault();
      setSize((s) => Math.min(maxSize, s + 2));
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-0 w-full flex-1",
        isHorizontal ? "flex-row" : "flex-col",
        className,
      )}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <div
        className="min-h-0 min-w-0 overflow-auto"
        style={
          (isHorizontal ? { width: `${size}%` } : { height: `${size}%` }) as CSSProperties
        }
      >
        {primary}
      </div>

      <div
        role="separator"
        aria-orientation={isHorizontal ? "vertical" : "horizontal"}
        aria-valuenow={Math.round(size)}
        aria-valuemin={minSize}
        aria-valuemax={maxSize}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        className={cn(
          "group flex shrink-0 items-center justify-center bg-border transition-colors duration-[var(--duration-hover)] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]",
          isHorizontal ? "w-px cursor-col-resize" : "h-px cursor-row-resize",
        )}
      >
        <GripVertical
          size={12}
          className={cn(
            "text-muted opacity-0 transition-opacity group-hover:opacity-100",
            !isHorizontal && "rotate-90",
          )}
          aria-hidden="true"
        />
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{secondary}</div>
    </div>
  );
}
