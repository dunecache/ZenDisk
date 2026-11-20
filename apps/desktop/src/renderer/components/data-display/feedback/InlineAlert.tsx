import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-[var(--space-3)] rounded-[var(--radius-md)] border px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--text-body)]",
  {
    variants: {
      variant: {
        info: "border-info/30 bg-info/10 text-info",
        success: "border-success/30 bg-success/10 text-success",
        warning: "border-warning/30 bg-warning/10 text-warning",
        danger: "border-danger/30 bg-danger/10 text-danger",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const icons = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
} as const;

export interface InlineAlertProps extends VariantProps<typeof alertVariants> {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** Contextual warning/info — icon + text, never color alone. */
export function InlineAlert({ variant = "info", title, children, className }: InlineAlertProps) {
  const key = (variant ?? "info") as keyof typeof icons;
  const Icon = icons[key];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
    >
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-[var(--space-1)] text-foreground">
        {title && <span className="font-medium">{title}</span>}
        <div className="text-muted">{children}</div>
      </div>
    </div>
  );
}
