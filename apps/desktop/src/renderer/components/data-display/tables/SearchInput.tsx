import { Search } from "lucide-react";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Searches the currently relevant data scope. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search
        size={16}
        className="pointer-events-none absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        clearable={value.length > 0}
        onClear={() => onChange("")}
        className="pl-[var(--space-8)]"
        aria-label={placeholder}
      />
    </div>
  );
}
