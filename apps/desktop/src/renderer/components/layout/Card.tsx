import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "muted" | "outlined" | "interactive";

const variantClass: Record<CardVariant, string> = {
  default: "border border-border bg-surface",
  muted: "border border-transparent bg-muted-background",
  outlined: "border border-input bg-transparent",
  interactive:
    "border border-border bg-surface transition-colors duration-[var(--duration-hover)] hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

/** Groups related information. Not for wrapping every individual element. */
export function Card({ variant = "default", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] p-[var(--space-5)]",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-[var(--space-3)]", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[length:var(--text-h3)] font-semibold", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[length:var(--text-small)] text-muted", className)} {...props} />
  );
}
