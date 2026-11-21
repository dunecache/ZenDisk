import { useState } from "react";
import { Button } from "@/components/ui";
import { Card } from "@/components/layout";
import { InlineAlert } from "@/components/data-display";
import { nativeApi } from "@/lib/native/client";
import { useAppVersion } from "@/hooks";

type UpdateState = "idle" | "checking" | "up-to-date" | "available" | "installing" | "error";

export function UpdatesSection() {
  const { data: version } = useAppVersion();
  const [state, setState] = useState<UpdateState>("idle");
  const [availableVersion, setAvailableVersion] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const check = async () => {
    setState("checking");
    try {
      const update = await nativeApi.updates.check();
      if (update) {
        setAvailableVersion(update.version);
        setState("available");
      } else {
        setState("up-to-date");
      }
    } catch {
      setState("error");
      setMessage("Update checks work in the installed Windows app. The browser preview has no updater.");
    }
  };

  const install = async () => {
    setState("installing");
    try {
      await nativeApi.updates.install();
    } catch {
      setState("error");
      setMessage("The update could not be installed. Check the release assets and try again.");
    }
  };

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <Card className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <h3 className="text-[length:var(--text-h3)] font-semibold">Software updates</h3>
          <p className="text-[length:var(--text-small)] text-muted tabular-nums">
            Current version {version ?? "0.0.0"}
          </p>
        </div>
        <div className="flex gap-[var(--space-2)]">
          <Button variant="outline" disabled={state === "checking" || state === "installing"} onClick={() => void check()}>
            {state === "checking" ? "Checking…" : "Check for updates"}
          </Button>
          {state === "available" && <Button onClick={() => void install()}>Install update</Button>}
        </div>
      </Card>

      {state === "up-to-date" && (
        <InlineAlert variant="success" title="Up to date">No newer signed build is available.</InlineAlert>
      )}
      {state === "available" && (
        <InlineAlert variant="info" title={`Version ${availableVersion} is available`}>
          The update is signed and will be verified before installation. ZenDisk will relaunch when it finishes.
        </InlineAlert>
      )}
      {state === "error" && <InlineAlert variant="warning" title="Update unavailable">{message}</InlineAlert>}
      {state === "installing" && (
        <InlineAlert variant="info" title="Installing update">Do not close ZenDisk while the signed update is applied.</InlineAlert>
      )}
    </div>
  );
}
