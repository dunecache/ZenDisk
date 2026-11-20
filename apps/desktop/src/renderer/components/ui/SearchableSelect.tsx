import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./Input";
import { selectTriggerClassName } from "./Select";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Single-select with a filter input, for long option lists. Uses Radix
 * Popover so the search field keeps focus; Radix Select remains the default
 * for short lists. Multi-selection is deferred until a workflow requires it.
 */
export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No options",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((option) =>
        option.label.toLowerCase().includes(normalizedQuery),
      )
    : options;

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn(selectTriggerClassName, "text-left", className)}
        >
          <span className={cn(!selected && "text-muted")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown size={16} className="shrink-0 text-muted" aria-hidden="true" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-[var(--radius-md)] border border-border bg-surface p-[var(--space-1)] shadow-[var(--shadow-dropdown)]"
        >
          <Input
            autoFocus
            clearable
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery("")}
            placeholder={searchPlaceholder}
            aria-label="Search options"
            className="h-8"
          />
          <div
            role="listbox"
            className="mt-[var(--space-1)] max-h-60 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <div className="px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-small)] text-muted">
                {emptyText}
              </div>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  onClick={() => {
                    onValueChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[var(--radius-xs)] px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-body)] transition-colors hover:bg-surface-secondary focus-visible:bg-surface-secondary focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                    option.value === value && "text-primary",
                  )}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check size={14} aria-hidden="true" />
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
