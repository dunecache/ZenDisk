import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * shadcn/ui-style primitive (cva variants + Radix Slot) restyled entirely
 * with ZenDisk tokens. See Spec.md §9 for the variant contract.
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-[var(--radius-md)] text-[length:var(--text-body)] font-medium transition-colors duration-[var(--duration-hover)] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)] disabled:pointer-events-none disabled:opacity-50 active:duration-[var(--duration-press)]",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline:
          "border border-input bg-transparent text-foreground hover:bg-surface-secondary",
        ghost: "bg-transparent text-foreground hover:bg-surface-secondary",
        destructive: "bg-danger text-danger-foreground hover:bg-danger/90",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-[var(--control-height-xs)] px-[var(--space-2)] text-[length:var(--text-small)]",
        sm: "h-[var(--control-height-sm)] px-[var(--space-3)]",
        md: "h-[var(--control-height)] px-[var(--space-4)]",
        lg: "h-[var(--control-height-lg)] px-[var(--space-5)]",
        icon: "h-[var(--control-height)] w-[var(--control-height)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button> (Radix Slot). */
  asChild?: boolean;
  /** Shows a spinner, sets aria-busy and prevents interaction. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin"
              size={16}
            />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
