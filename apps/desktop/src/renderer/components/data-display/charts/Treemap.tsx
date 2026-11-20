import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/data-display/feedback";
import { FileSize } from "@/components/data-display/metrics";

export interface TreemapNode {
  id: string;
  name: string;
  sizeBytes: number;
  category: string;
  /** CSS color variable, e.g. "var(--chart-documents)". */
  color: string;
  children?: TreemapNode[];
}

export interface TreemapProps {
  data: TreemapNode[];
  selectedId?: string;
  onSelect?: (node: TreemapNode) => void;
  onDrillDown?: (node: TreemapNode) => void;
  className?: string;
}

interface Rect {
  node: TreemapNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Squarified treemap layout on a 100x100 grid (Bruls et al.). */
function layout(nodes: TreemapNode[]): Rect[] {
  const total = nodes.reduce((sum, node) => sum + node.sizeBytes, 0);
  if (total <= 0) return [];

  const items = [...nodes]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .map((node) => ({ node, area: (node.sizeBytes / total) * 10_000 }));

  const result: Rect[] = [];
  let x = 0;
  let y = 0;
  let width = 100;
  let height = 100;
  let row: typeof items = [];

  const sum = (values: typeof items) => values.reduce((acc, item) => acc + item.area, 0);
  const worst = (values: typeof items, side: number) => {
    const areas = values.map((item) => item.area);
    const s = areas.reduce((acc, value) => acc + value, 0);
    const max = Math.max(...areas);
    const min = Math.min(...areas);
    return Math.max((side * side * max) / (s * s), (s * s) / (side * side * min));
  };

  const flush = () => {
    if (row.length === 0) return;
    const rowArea = sum(row);
    if (width >= height) {
      const rowHeight = rowArea / width;
      let cursor = x;
      for (const item of row) {
        const itemWidth = item.area / rowHeight;
        result.push({ node: item.node, x: cursor, y, width: itemWidth, height: rowHeight });
        cursor += itemWidth;
      }
      y += rowHeight;
      height -= rowHeight;
    } else {
      const rowWidth = rowArea / height;
      let cursor = y;
      for (const item of row) {
        const itemHeight = item.area / rowWidth;
        result.push({ node: item.node, x, y: cursor, width: rowWidth, height: itemHeight });
        cursor += itemHeight;
      }
      x += rowWidth;
      width -= rowWidth;
    }
    row = [];
  };

  while (items.length > 0) {
    const side = Math.min(width, height);
    const next = items[0];
    if (row.length === 0 || worst([...row, next], side) <= worst(row, side)) {
      row.push(items.shift()!);
    } else {
      flush();
    }
  }
  flush();

  return result;
}

/** Storage visualization with labels, selection, drill-down and an accessible list. */
export function Treemap({
  data,
  selectedId,
  onSelect,
  onDrillDown,
  className,
}: TreemapProps) {
  const rects = useMemo(() => layout(data), [data]);
  const [hovered, setHovered] = useState<TreemapNode | null>(null);
  const categories = useMemo(() => {
    const map = new Map<string, { color: string; bytes: number }>();
    for (const node of data) {
      const entry = map.get(node.category) ?? { color: node.color, bytes: 0 };
      entry.bytes += node.sizeBytes;
      map.set(node.category, entry);
    }
    return [...map.entries()];
  }, [data]);

  if (rects.length === 0) {
    return (
      <EmptyState
        className={className}
        heading="No data to visualize"
        description="Run a scan to build the treemap."
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-[var(--space-3)]", className)}>
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface">
        {rects.map((rect) => {
          const isSelected = rect.node.id === selectedId;
          return (
            <button
              key={rect.node.id}
              type="button"
              title={`${rect.node.name} — ${new Intl.NumberFormat().format(rect.node.sizeBytes)} bytes (${rect.node.category})`}
              onMouseEnter={() => setHovered(rect.node)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(rect.node)}
              onBlur={() => setHovered(null)}
              onClick={() => onSelect?.(rect.node)}
              onDoubleClick={() => onDrillDown?.(rect.node)}
              aria-label={`${rect.node.name}, ${rect.node.category}`}
              className={cn(
                "absolute overflow-hidden border border-background p-[var(--space-1)] text-left transition-[filter] duration-[var(--duration-hover)] hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]",
                isSelected && "z-10 ring-2 ring-[color:var(--focus)]",
              )}
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
                backgroundColor: rect.node.color,
              }}
            >
              {rect.width > 8 && rect.height > 12 && (
                <span className="block truncate text-[length:var(--text-caption)] font-medium text-foreground">
                  {rect.node.name}
                </span>
              )}
            </button>
          );
        })}
        {hovered && (
          <div className="pointer-events-none absolute bottom-[var(--space-2)] left-[var(--space-2)] rounded-[var(--radius-sm)] border border-border bg-surface px-[var(--space-3)] py-[var(--space-2)] shadow-[var(--shadow-dropdown)]">
            <div className="text-[length:var(--text-body)] font-medium">{hovered.name}</div>
            <div className="text-[length:var(--text-small)] text-muted">
              <FileSize bytes={hovered.sizeBytes} /> · {hovered.category}
            </div>
          </div>
        )}
      </div>

      <ul className="flex flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-1)]">
        {categories.map(([category, info]) => (
          <li key={category} className="flex items-center gap-[var(--space-2)] text-[length:var(--text-small)] text-muted">
            <span aria-hidden="true" className="h-2 w-2 rounded-xs" style={{ backgroundColor: info.color }} />
            {category}
            <FileSize bytes={info.bytes} />
          </li>
        ))}
      </ul>

      <details className="text-[length:var(--text-small)]">
        <summary className="cursor-pointer text-muted">Accessible list</summary>
        <ul className="mt-[var(--space-2)] flex flex-col gap-[var(--space-1)]">
          {[...data]
            .sort((a, b) => b.sizeBytes - a.sizeBytes)
            .map((node) => (
              <li key={node.id} className="flex items-center justify-between gap-[var(--space-2)] border-b border-border py-[var(--space-1)]">
                <span className="truncate">{node.name}</span>
                <span className="flex shrink-0 items-center gap-[var(--space-2)] text-muted">
                  {node.category}
                  <FileSize bytes={node.sizeBytes} />
                </span>
              </li>
            ))}
        </ul>
      </details>
    </div>
  );
}
