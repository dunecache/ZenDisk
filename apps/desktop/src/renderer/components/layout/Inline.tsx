import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { type SpaceToken, gapClass } from "./Stack";

export type InlineAlign = "start" | "center" | "end" | "baseline";
export type InlineJustify = "start" | "center" | "end" | "between";

const alignClass: Record<InlineAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
};
const justifyClass: Record<InlineJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export interface InlineProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceToken;
  align?: InlineAlign;
  justify?: InlineJustify;
  wrap?: boolean;
}

/** Horizontal layout with alignment and tokenized gap. */
export function Inline({
  gap = 2,
  align = "center",
  justify = "start",
  wrap = false,
  className,
  ...props
}: InlineProps) {
  return (
    <div
      className={cn(
        "flex",
        gapClass[gap],
        alignClass[align],
        justifyClass[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  );
}
