import { Card } from "@/components/layout";
import { SettingSwitch } from "../../SettingField";
import { usePreferencesStore } from "@/stores";

export function NotificationsSection() {
  const set = usePreferencesStore((state) => state.set);
  const notifyCleanup = usePreferencesStore((state) => state.notifyCleanup);
  const notifyDuplicates = usePreferencesStore((state) => state.notifyDuplicates);
  const notifyAutomation = usePreferencesStore((state) => state.notifyAutomation);
  const notifyUpdates = usePreferencesStore((state) => state.notifyUpdates);

  return (
    <Card className="p-0">
      <div className="p-[var(--space-5)]">
        <SettingSwitch
          id="settings-notify-cleanup"
          label="Cleanup results"
          description="Notify when a cleanup finishes and how much space was reclaimed."
          checked={notifyCleanup}
          onCheckedChange={(checked) => set("notifyCleanup", checked)}
        />
        <SettingSwitch
          id="settings-notify-duplicates"
          label="Duplicate scans"
          description="Notify when a scan finds new groups. Nothing is removed automatically."
          checked={notifyDuplicates}
          onCheckedChange={(checked) => set("notifyDuplicates", checked)}
        />
        <SettingSwitch
          id="settings-notify-automation"
          label="Scheduled tasks"
          description="Notify when a scheduled run completes or reports an error."
          checked={notifyAutomation}
          onCheckedChange={(checked) => set("notifyAutomation", checked)}
        />
        <SettingSwitch
          id="settings-notify-updates"
          label="Software updates"
          description="Notify when a newer signed build is available."
          checked={notifyUpdates}
          onCheckedChange={(checked) => set("notifyUpdates", checked)}
        />
      </div>
    </Card>
  );
}
