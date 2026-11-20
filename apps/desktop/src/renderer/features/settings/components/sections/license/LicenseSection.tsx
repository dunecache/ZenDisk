import { Button } from "@/components/ui";
import { Card } from "@/components/layout";
import { InlineAlert } from "@/components/data-display";
import { SettingSwitch } from "../../SettingField";
import { usePreferencesStore } from "@/stores";

export function LicenseSection() {
  const set = usePreferencesStore((state) => state.set);
  const autoRenew = usePreferencesStore((state) => state.licenseAutoRenew);

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Card className="flex flex-col gap-[var(--space-3)]">
        <div className="flex items-center justify-between gap-[var(--space-3)]">
          <div className="flex flex-col gap-[var(--space-1)]">
            <h3 className="text-[length:var(--text-h3)] font-semibold">Free plan</h3>
            <p className="text-[length:var(--text-small)] text-muted">
              Local storage tools with no account required.
            </p>
          </div>
          <Button variant="outline" disabled onClick={() => undefined}>
            Manage plan
          </Button>
        </div>
        <SettingSwitch
          id="settings-license-renew"
          label="Renew automatically"
          description="Only applies to a paid plan. No payment details are stored in this preview."
          checked={autoRenew}
          onCheckedChange={(checked) => set("licenseAutoRenew", checked)}
        />
      </Card>
      <InlineAlert variant="info" title="License and plan">
        Plan management is not connected yet. Choosing a paid plan will never
        happen implicitly.
      </InlineAlert>
    </div>
  );
}
