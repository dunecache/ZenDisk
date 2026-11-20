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

export function StorageSection() {
  const set = usePreferencesStore((state) => state.set);
  const driveId = usePreferencesStore((state) => state.storageSelectedDriveId);
  const excludeNetwork = usePreferencesStore((state) => state.storageExcludeNetworkDrives);
  const scanOnStartup = usePreferencesStore((state) => state.storageScanOnStartup);

  return (
    <Card className="p-0">
      <div className="p-[var(--space-5)]">
        <SettingField
          label="Default drive"
          description="Used for new scans and reports when no drive is selected."
          htmlFor="settings-storage-drive"
          control={
            <Select value={driveId} onValueChange={(value) => set("storageSelectedDriveId", value)}>
              <SelectTrigger id="settings-storage-drive" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="C:">C: — System</SelectItem>
                <SelectItem value="D:">D: — Storage</SelectItem>
              </SelectContent>
            </Select>
          }
        />
        <SettingSwitch
          id="settings-storage-network"
          label="Exclude network drives"
          description="Avoids slow or unavailable network locations during scans."
          checked={excludeNetwork}
          onCheckedChange={(checked) => set("storageExcludeNetworkDrives", checked)}
        />
        <SettingSwitch
          id="settings-storage-startup"
          label="Refresh drive info on startup"
          description="Reads capacity and free space when ZenDisk opens."
          checked={scanOnStartup}
          onCheckedChange={(checked) => set("storageScanOnStartup", checked)}
        />
      </div>
    </Card>
  );
}
