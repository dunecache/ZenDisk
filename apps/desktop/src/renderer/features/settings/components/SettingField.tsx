import type { ReactNode } from "react";
import { Switch } from "@/components/ui";

export interface SettingFieldProps {
  label: string;
  description: ReactNode;
  htmlFor?: string;
  control: ReactNode;
}

/** Label/control row used by every settings section. */
export function SettingField({ label, description, htmlFor, control }: SettingFieldProps) {
  return (
    <div className="flex items-start justify-between gap-[var(--space-6)] border-b border-border py-[var(--space-4)] last:border-0">
      <div className="flex min-w-0 flex-col gap-[var(--space-1)]">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-[length:var(--text-body)] font-medium">
            {label}
          </label>
        ) : (
          <span className="text-[length:var(--text-body)] font-medium">{label}</span>
        )}
        <p className="text-[length:var(--text-small)] text-muted">{description}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export interface SettingSwitchProps {
  id: string;
  label: string;
  description: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingSwitch({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: SettingSwitchProps) {
  return (
    <SettingField
      label={label}
      description={description}
      htmlFor={id}
      control={
        <Switch
          id={id}
          checked={checked}
          disabled={disabled}
          aria-label={label}
          onCheckedChange={onCheckedChange}
        />
      }
    />
  );
}
