import { Button, Input, SearchableSelect, Separator } from "@/components/ui";
import type { OrganizeRule } from "@/types";

export interface RuleEditorProps {
  rule: OrganizeRule | null;
  onPreview: () => void;
  onSave: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-[var(--space-2)]">
      <span className="text-[length:var(--text-small)] text-muted">{label}</span>
      {children}
    </label>
  );
}

export function RuleEditor({ rule, onPreview, onSave }: RuleEditorProps) {
  if (!rule) {
    return (
      <p className="py-[var(--space-8)] text-center text-[length:var(--text-body)] text-muted">
        Select a rule to edit, or create a new one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Field label="Name">
        <Input defaultValue={rule.name} />
      </Field>
      <Field label="Source">
        <SearchableSelect
          aria-label="Source"
          options={[{ value: rule.source, label: rule.source }]}
          value={rule.source}
          onValueChange={() => {}}
        />
      </Field>
      <Separator />
      <div className="flex flex-col gap-[var(--space-2)]">
        <span className="text-[length:var(--text-small)] text-muted">Conditions</span>
        {rule.conditions.map((condition) => (
          <div key={condition} className="rounded-[var(--radius-sm)] border border-border px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-body)]">
            {condition}
          </div>
        ))}
      </div>
      <Separator />
      <Field label="Action">
        <Input defaultValue={rule.action} />
      </Field>
      <Field label="Destination">
        <Input defaultValue={rule.destination} className="text-mono" />
      </Field>
      <Field label="Exclusions">
        <Input defaultValue={rule.exclusions.join(", ")} placeholder="e.g. *.part, *.tmp" />
      </Field>
      <Field label="Schedule">
        <SearchableSelect
          aria-label="Schedule"
          options={[{ value: rule.schedule, label: rule.schedule }]}
          value={rule.schedule}
          onValueChange={() => {}}
        />
      </Field>
      <div className="flex gap-[var(--space-2)]">
        <Button variant="outline" onClick={onPreview}>Preview</Button>
        <Button onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}
