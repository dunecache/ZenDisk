import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

/** A titled content region with optional description and actions. */
export function Section({
  title,
  description,
  actions,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-[var(--space-4)]", className)} {...props}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-[var(--space-4)]">
          <div className="flex flex-col gap-[var(--space-1)]">
            {title && (
              <h2 className="text-[length:var(--text-h2)] font-semibold">{title}</h2>
            )}
            {description && (
              <p className="text-[length:var(--text-body)] text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
