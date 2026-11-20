import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

export const gapClass: Record<SpaceToken, string> = {
  1: "gap-[var(--space-1)]",
  2: "gap-[var(--space-2)]",
  3: "gap-[var(--space-3)]",
  4: "gap-[var(--space-4)]",
  5: "gap-[var(--space-5)]",
  6: "gap-[var(--space-6)]",
  8: "gap-[var(--space-8)]",
  10: "gap-[var(--space-10)]",
  12: "gap-[var(--space-12)]",
  16: "gap-[var(--space-16)]",
};

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceToken;
}

/** Vertical layout with tokenized spacing. */
export function Stack({ gap = 4, className, ...props }: StackProps) {
  return (
    <div className={cn("flex flex-col", gapClass[gap], className)} {...props} />
  );
}
