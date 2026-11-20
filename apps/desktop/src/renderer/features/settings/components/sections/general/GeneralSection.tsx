import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Card } from "@/components/layout";
import { SettingField, SettingSwitch } from "../../SettingField";
import { usePreferencesStore } from "@/stores";
import type { Density } from "@/stores";

export function GeneralSection() {
  const density = usePreferencesStore((state) => state.density);
  const scanOnStartup = usePreferencesStore((state) => state.storageScanOnStartup);
  const set = usePreferencesStore((state) => state.set);

  return (
    <Card className="p-0">
      <div className="p-[var(--space-5)]">
        <SettingField
          label="Interface density"
          description="Compact fits more rows on screen; comfortable gives each row more room."
          htmlFor="settings-general-density"
          control={
            <Select value={density} onValueChange={(value) => set("density", value as Density)}>
              <SelectTrigger id="settings-general-density" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingSwitch
          id="settings-general-scan"
          label="Scan drives on startup"
          description="Refreshes drive capacity when ZenDisk opens. Scans are never automatic file deletions."
          checked={scanOnStartup}
          onCheckedChange={(checked) => set("storageScanOnStartup", checked)}
        />
        <SettingField
          label="Software updates"
          description="Check for updates is added with native integration in Phase 6."
          control={<span className="text-[length:var(--text-small)] text-muted">Not available yet</span>}
        />
      </div>
    </Card>
  );
}
