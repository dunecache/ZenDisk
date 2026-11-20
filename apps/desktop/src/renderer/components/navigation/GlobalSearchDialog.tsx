import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input } from "@/components/ui";
import { EmptyState } from "@/components/data-display";
import { bottomNav, primaryNav } from "./nav-config";

export interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const destinations = [...primaryNav, ...bottomNav];

/** Ctrl+K destination search. Keyboard-only friendly and scoped to navigation. */
export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return text === ""
      ? destinations
      : destinations.filter((item) => item.label.toLowerCase().includes(text));
  }, [query]);

  const go = (to: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(to);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search ZenDisk</DialogTitle>
          <DialogDescription>Jump to a screen by name.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          type="search"
          aria-label="Search screens"
          placeholder="Screens, settings, help"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results.length > 0) go(results[0].to);
          }}
        />
        {results.length === 0 ? (
          <EmptyState heading="No matching screens" description="Try a different name." />
        ) : (
          <div className="flex max-h-72 flex-col gap-[var(--space-1)] overflow-y-auto">
            {results.map((item) => (
              <Button
                key={item.to}
                variant="ghost"
                className="justify-start"
                onClick={() => go(item.to)}
              >
                <item.icon size={16} className="text-muted" aria-hidden="true" />
                {item.label}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
