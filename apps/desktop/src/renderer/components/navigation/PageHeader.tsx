import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  /** Contextual selector, e.g. a drive picker. */
  selector?: ReactNode;
  actions?: ReactNode;
  /** Notification indicator slot. */
  notifications?: ReactNode;
  className?: string;
}

/** Page title region. Screens must not repeat the title in their content. */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  selector,
  actions,
  notifications,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-[var(--header-height)] shrink-0 items-center justify-between gap-[var(--space-4)] border-b border-border px-[var(--page-padding)]",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center text-[length:var(--text-caption)] text-muted">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center">
                {index > 0 && (
                  <ChevronRight size={12} className="mx-[var(--space-1)]" aria-hidden="true" />
                )}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-foreground hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <div className="flex min-w-0 items-center gap-[var(--space-3)]">
          <h1 className="truncate text-[length:var(--text-h1)] font-semibold">{title}</h1>
          {selector}
        </div>
        {description && (
          <p className="truncate text-[length:var(--text-small)] text-muted">{description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-[var(--space-2)]">
        {notifications}
        {actions}
      </div>
    </header>
  );
}
