import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/layout";

export interface QuickActionProps {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function QuickAction({ label, description, icon: Icon, onClick }: QuickActionProps) {
  return (
    <Card
      variant="interactive"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="flex items-center gap-[var(--space-3)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-accent/20 text-primary">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[length:var(--text-body)] font-medium">{label}</span>
        <span className="truncate text-[length:var(--text-small)] text-muted">{description}</span>
      </span>
      <ArrowRight size={16} className="ml-auto shrink-0 text-muted" aria-hidden="true" />
    </Card>
  );
}
