import { useEffect } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "@/components/ui";
import { useToastStore, type ToastItem, type ToastVariant } from "@/stores/ui/toast";

const icons = {
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

const variantClass: Record<ToastVariant, string> = {
  success: "border-success/30 text-success",
  info: "border-info/30 text-info",
  warning: "border-warning/30 text-warning",
  error: "border-danger/30 text-danger",
};

function ToastRow({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = icons[item.variant];

  useEffect(() => {
    if (item.duration <= 0) return;
    const timeout = window.setTimeout(() => dismiss(item.id), item.duration);
    return () => window.clearTimeout(timeout);
  }, [item.id, item.duration, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-80 items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border border-border bg-surface p-[var(--space-4)] shadow-[var(--shadow-panel)]",
      )}
    >
      <Icon size={16} className={cn("mt-0.5 shrink-0", variantClass[item.variant])} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
        <span className="text-[length:var(--text-body)] font-medium text-foreground">
          {item.title}
        </span>
        {item.description && (
          <span className="text-[length:var(--text-small)] text-muted">
            {item.description}
          </span>
        )}
      </div>
      <IconButton
        label="Dismiss notification"
        variant="ghost"
        className="-mr-[var(--space-2)] -mt-[var(--space-2)]"
        onClick={() => dismiss(item.id)}
      >
        <X size={14} aria-hidden="true" />
      </IconButton>
    </div>
  );
}

/** Global toast viewport. Mount once in AppShell. */
export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="pointer-events-none fixed bottom-[var(--space-6)] right-[var(--space-6)] z-[60] flex flex-col gap-[var(--space-2)]">
      {toasts.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </div>
  );
}
