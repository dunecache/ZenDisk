import { Card } from "@/components/layout";
import { InlineAlert } from "@/components/data-display";
import { SettingSwitch } from "../../SettingField";
import { usePreferencesStore } from "@/stores";

export function PrivacySection() {
  const set = usePreferencesStore((state) => state.set);
  const telemetry = usePreferencesStore((state) => state.privacyTelemetry);
  const rememberPaths = usePreferencesStore((state) => state.privacyRememberPaths);
  const clearOnExit = usePreferencesStore((state) => state.privacyClearHistoryOnExit);

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Card className="p-0">
        <div className="p-[var(--space-5)]">
          <SettingSwitch
            id="settings-privacy-telemetry"
            label="Share anonymous usage data"
            description="Off by default. ZenDisk does not send file names or paths."
            checked={telemetry}
            onCheckedChange={(checked) => set("privacyTelemetry", checked)}
          />
          <SettingSwitch
            id="settings-privacy-paths"
            label="Remember recent paths"
            description="Shows the folders you used in recent scans and rules."
            checked={rememberPaths}
            onCheckedChange={(checked) => set("privacyRememberPaths", checked)}
          />
          <SettingSwitch
            id="settings-privacy-history"
            label="Clear operation history on exit"
            description="Removes the local audit trail when ZenDisk closes. Recovery records stay until you close the app."
            checked={clearOnExit}
            onCheckedChange={(checked) => set("privacyClearHistoryOnExit", checked)}
          />
        </div>
      </Card>
      <InlineAlert variant="warning" title="Local data only in this preview">
        These switches are stored locally. Native persistence and any data
        sharing require explicit consent in a later phase.
      </InlineAlert>
    </div>
  );
}
