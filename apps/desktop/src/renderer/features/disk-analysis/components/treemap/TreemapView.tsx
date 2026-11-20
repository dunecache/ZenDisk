import { useState } from "react";
import { Card } from "@/components/layout";
import { Treemap } from "@/components/data-display";
import type { TreeNode } from "@/types";

export interface TreemapViewProps {
  tree: TreeNode[];
}

/** Treemap with drill-down and breadcrumbs to ancestors. */
export function TreemapView({ tree }: TreemapViewProps) {
  const [path, setPath] = useState<TreeNode[]>([]);
  const current = path.length === 0 ? tree : (path[path.length - 1].children ?? []);

  const navigateTo = (index: number) => setPath(path.slice(0, index));

  return (
    <Card className="flex flex-col gap-[var(--space-3)]">
      <div className="flex items-center justify-between gap-[var(--space-3)]">
        <h3 className="text-[length:var(--text-h3)] font-semibold">Storage map</h3>
        <nav aria-label="Treemap location" className="flex items-center gap-[var(--space-1)] text-[length:var(--text-small)] text-muted">
          <button
            type="button"
            onClick={() => navigateTo(0)}
            className={path.length === 0 ? "font-medium text-foreground" : "hover:text-foreground hover:underline"}
          >
            Root
          </button>
          {path.map((node, index) => (
            <span key={node.id} className="flex items-center gap-[var(--space-1)]">
              <span aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => navigateTo(index + 1)}
                className={index === path.length - 1 ? "font-medium text-foreground" : "hover:text-foreground hover:underline"}
              >
                {node.name}
              </button>
            </span>
          ))}
        </nav>
      </div>

      {current.length === 0 ? (
        <p className="py-[var(--space-8)] text-center text-[length:var(--text-body)] text-muted">
          No children to display.
        </p>
      ) : (
        <Treemap
          data={current}
          onDrillDown={(node) => {
            const match = current.find((item) => item.id === node.id);
            if (match?.children?.length) setPath([...path, match]);
          }}
        />
      )}
    </Card>
  );
}
