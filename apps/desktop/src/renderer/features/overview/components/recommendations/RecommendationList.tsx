import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, X } from "lucide-react";
import { EmptyState, FileSize } from "@/components/data-display";
import { Button, IconButton } from "@/components/ui";
import { Card } from "@/components/layout";
import type { Recommendation } from "@/types";

export interface RecommendationListProps {
  recommendations: Recommendation[];
}

/** Evidence-based, individually dismissible suggestions. */
export function RecommendationList({ recommendations }: RecommendationListProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = recommendations.filter((item) => !dismissed.has(item.id));

  if (visible.length === 0) {
    return (
      <EmptyState
        heading="All caught up"
        description="No recommendations right now. Run a scan to find new opportunities."
      />
    );
  }

  return (
    <div className="grid gap-[var(--space-3)] sm:grid-cols-2">
      {visible.map((item) => (
        <Card key={item.id} className="relative flex flex-col gap-[var(--space-2)]">
          <IconButton
            label={`Dismiss recommendation: ${item.title}`}
            variant="ghost"
            className="absolute right-[var(--space-3)] top-[var(--space-3)]"
            onClick={() =>
              setDismissed((current) => new Set(current).add(item.id))
            }
          >
            <X size={14} aria-hidden="true" />
          </IconButton>
          <span className="flex items-center gap-[var(--space-2)] text-[length:var(--text-h3)] font-semibold">
            <Lightbulb size={16} className="text-warning" aria-hidden="true" />
            {item.title}
          </span>
          <p className="pr-[var(--space-6)] text-[length:var(--text-body)] text-muted">
            {item.evidence}
          </p>
          <div className="flex items-center justify-between gap-[var(--space-2)]">
            {item.potentialBytes !== undefined && (
              <span className="text-[length:var(--text-small)] text-muted">
                Up to <FileSize bytes={item.potentialBytes} />
              </span>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(item.route)}>
              Review
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
