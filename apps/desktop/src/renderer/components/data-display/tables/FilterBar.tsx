import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  children: ReactNode;
  className?: string;
}

/** Composable row of filter controls for the current data scope. */
export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-[var(--space-2)]", className)}>
      {children}
    </div>
  );
}
