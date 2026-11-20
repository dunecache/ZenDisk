import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "flex h-[var(--control-height)] w-full rounded-[var(--radius-md)] border border-input bg-surface px-[var(--space-3)] text-[length:var(--text-body)] text-foreground placeholder:text-muted transition-colors duration-[var(--duration-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)] disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-[length:var(--text-body)]",
  {
    variants: {
      variant: {
        default: "",
        invalid: "border-danger focus-visible:ring-[color:var(--danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /** Shows a clear button. For controlled inputs, handle `onClear` to reset state. */
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      clearable = false,
      onClear,
      value,
      onChange,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    const isControlled = value !== undefined;

    const handleClear = () => {
      if (!isControlled && innerRef.current) {
        innerRef.current.value = "";
        innerRef.current.focus();
      }
      onClear?.();
    };

    return (
      <div className="relative w-full">
        <input
          ref={setRefs}
          value={value}
          onChange={onChange}
          aria-invalid={variant === "invalid" ? true : ariaInvalid}
          className={cn(
            inputVariants({ variant }),
            clearable && "pr-[var(--space-8)]",
            className,
          )}
          {...props}
        />
        {clearable && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear input"
            className="absolute right-[var(--space-2)] top-1/2 -translate-y-1/2 rounded-[var(--radius-xs)] p-[var(--space-1)] text-muted transition-colors duration-[var(--duration-hover)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
