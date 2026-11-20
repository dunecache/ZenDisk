import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Card } from "@/components/layout";
import { SettingField, SettingSwitch } from "../../SettingField";
import { usePreferencesStore, useThemeStore } from "@/stores";
import type { ThemeMode } from "@/types";

export function AppearanceSection() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const showNotice = usePreferencesStore((state) => state.showSampleDataNotice);
  const set = usePreferencesStore((state) => state.set);

  return (
    <Card className="p-0">
      <div className="p-[var(--space-5)]">
        <SettingField
          label="Theme"
          description="System follows your Windows color setting. Light and dark are equally supported."
          htmlFor="settings-appearance-theme"
          control={
            <Select value={mode} onValueChange={(value) => setMode(value as ThemeMode)}>
              <SelectTrigger id="settings-appearance-theme" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Warm light</SelectItem>
                <SelectItem value="dark">Deep botanical dark</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingSwitch
          id="settings-appearance-notice"
          label="Show sample-data notices"
          description="Keeps the preview banner on mock-backed screens. Hiding it does not make the data real."
          checked={showNotice}
          onCheckedChange={(checked) => set("showSampleDataNotice", checked)}
        />
      </div>
    </Card>
  );
}
