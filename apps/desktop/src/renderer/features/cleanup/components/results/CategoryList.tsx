import { InlineAlert, FileSize } from "@/components/data-display";
import { Checkbox } from "@/components/ui";
import { Card } from "@/components/layout";
import type { CleanupCategory } from "@/types";

export interface CategoryListProps {
  categories: CleanupCategory[];
  selected: Set<string>;
  onToggle: (id: string, selected: boolean) => void;
}

export function CategoryList({ categories, selected, onToggle }: CategoryListProps) {
  return (
    <Card className="flex flex-col gap-0 p-0">
      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-start gap-[var(--space-3)] border-b border-border px-[var(--space-5)] py-[var(--space-4)] last:border-0"
        >
          <Checkbox
            className="mt-0.5"
            checked={selected.has(category.id)}
            onCheckedChange={(checked) => onToggle(category.id, checked === true)}
            aria-label={`Select ${category.name}`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
            <div className="flex items-center justify-between gap-[var(--space-2)]">
              <span className="text-[length:var(--text-body)] font-medium">{category.name}</span>
              <span className="shrink-0 tabular-nums"><FileSize bytes={category.bytes} /></span>
            </div>
            <span className="text-[length:var(--text-small)] text-muted">{category.description}</span>
            {category.warning && (
              <InlineAlert variant="warning" className="mt-[var(--space-1)]">
                {category.warning}
              </InlineAlert>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
