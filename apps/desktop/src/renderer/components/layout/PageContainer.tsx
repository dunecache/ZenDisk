import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Consistent content padding and maximum width for every screen. */
export function PageContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px] p-[var(--page-padding)]",
        className,
      )}
      {...props}
    />
  );
}
