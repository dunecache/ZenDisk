import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { OrganizeRule } from "@/types";

export interface RuleListProps {
  rules: OrganizeRule[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export function RuleList({ rules, selectedId, onSelect }: RuleListProps) {
  return (
    <nav aria-label="Rules" className="flex flex-col gap-[var(--space-1)]">
      {rules.map((rule) => (
        <Button
          key={rule.id}
          variant="ghost"
          className={cn(
            "w-full justify-start",
            selectedId === rule.id && "bg-accent/20 text-primary",
          )}
          onClick={() => onSelect(rule.id)}
        >
          {rule.name}
        </Button>
      ))}
    </nav>
  );
}
