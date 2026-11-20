import { Card } from "@/components/layout";
import { InlineAlert } from "@/components/data-display";
import { SettingSwitch } from "../../SettingField";
import { usePreferencesStore } from "@/stores";

export function CleanupSection() {
  const set = usePreferencesStore((state) => state.set);
  const recycleBin = usePreferencesStore((state) => state.cleanupUseRecycleBin);
  const skipSystem = usePreferencesStore((state) => state.cleanupSkipSystemFolders);

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Card className="p-0">
        <div className="p-[var(--space-5)]">
          <SettingSwitch
            id="settings-cleanup-confirm"
            label="Require confirmation before deleting"
            description="Always shows the exact files, their locations, and recovery options first."
            checked
            disabled
            onCheckedChange={() => undefined}
          />
          <SettingSwitch
            id="settings-cleanup-recycle"
            label="Move files to the Recycle Bin"
            description="Keeps removed files recoverable where the filesystem allows."
            checked={recycleBin}
            onCheckedChange={(checked) => set("cleanupUseRecycleBin", checked)}
          />
          <SettingSwitch
            id="settings-cleanup-system"
            label="Skip system folders"
            description="Excludes Windows and program folders from cleanup candidates."
            checked={skipSystem}
            onCheckedChange={(checked) => set("cleanupSkipSystemFolders", checked)}
          />
        </div>
      </Card>
      <InlineAlert variant="info" title="Safety rule">
        Confirmation cannot be disabled. ZenDisk never deletes files just
        because a hash or rule matches.
      </InlineAlert>
    </div>
  );
}
