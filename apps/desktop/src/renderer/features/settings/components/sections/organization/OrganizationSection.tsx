import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Card } from "@/components/layout";
import { SettingField, SettingSwitch } from "../../SettingField";
import { usePreferencesStore } from "@/stores";
import type { ConflictStrategy } from "@/stores";

export function OrganizationSection() {
  const set = usePreferencesStore((state) => state.set);
  const preview = usePreferencesStore((state) => state.organizationPreviewBeforeApply);
  const conflict = usePreferencesStore((state) => state.organizationConflictStrategy);
  const destination = usePreferencesStore((state) => state.organizationDefaultDestination);

  return (
    <Card className="p-0">
      <div className="p-[var(--space-5)]">
        <SettingSwitch
          id="settings-organization-preview"
          label="Preview changes before applying"
          description="Always shows proposed moves, conflicts, and destinations first. This cannot be disabled."
          checked
          disabled
          onCheckedChange={() => undefined}
        />
        <SettingField
          label="Conflicting destinations"
          description="Ask means each conflict is shown for review; skip leaves the file where it is."
          htmlFor="settings-organization-conflict"
          control={
            <Select
              value={conflict}
              onValueChange={(value) => set("organizationConflictStrategy", value as ConflictStrategy)}
            >
              <SelectTrigger id="settings-organization-conflict" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask">Ask</SelectItem>
                <SelectItem value="skip">Skip</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingField
          label="Default destination"
          description="Used when a rule does not specify its own target directory."
          htmlFor="settings-organization-destination"
          control={
            <Input
              id="settings-organization-destination"
              className="text-mono"
              value={destination}
              onChange={(event) => set("organizationDefaultDestination", event.target.value)}
            />
          }
        />
        <SettingField
          label="Rule preview"
          description={`Preview before apply is ${preview ? "on" : "off"}.`}
          control={<span className="text-[length:var(--text-small)] text-muted">Locked</span>}
        />
      </div>
    </Card>
  );
}
