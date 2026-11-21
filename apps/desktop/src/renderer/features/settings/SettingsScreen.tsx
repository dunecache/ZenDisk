import { useState, type ComponentType } from "react";
import { PageContainer, Section } from "@/components/layout";
import { PageHeader } from "@/components/navigation";
import { Button } from "@/components/ui";
import { EmptyState, InlineAlert, SearchInput, SkeletonCard } from "@/components/data-display";
import { useSettings, useAppVersion } from "@/hooks";
import {
  AppearanceSection,
  CleanupSection,
  GeneralSection,
  LicenseSection,
  NotificationsSection,
  OrganizationSection,
  PrivacySection,
  StorageSection,
  UpdatesSection,
} from "./components";
import type { SettingsSectionKey } from "@/types";

const sectionComponents: Record<SettingsSectionKey, ComponentType> = {
  general: GeneralSection,
  appearance: AppearanceSection,
  notifications: NotificationsSection,
  cleanup: CleanupSection,
  organization: OrganizationSection,
  storage: StorageSection,
  privacy: PrivacySection,
  license: LicenseSection,
  updates: UpdatesSection,
};

export function SettingsScreen() {
  const { data, isLoading, isError, refetch } = useSettings();
  const { data: version } = useAppVersion();
  const [section, setSection] = useState<SettingsSectionKey>("general");
  const [query, setQuery] = useState("");

  const loading = isLoading || !data;
  const denied = data?.access === "denied";
  const sections = data?.sections ?? [];
  const filtered = sections.filter((item) => {
    const text = query.trim().toLowerCase();
    return text === "" || item.label.toLowerCase().includes(text);
  });
  const active = sections.find((item) => item.key === section);
  const ActiveComponent = sectionComponents[section];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Choose how ZenDisk scans, notifies, and protects your files."
        breadcrumbs={[{ label: "ZenDisk" }, { label: "Settings" }]}
        actions={
          <span className="text-[length:var(--text-small)] text-muted tabular-nums">
            Version {version ?? data?.currentVersion ?? "0.0.0"}
          </span>
        }
      />
      <PageContainer>
        <div className="flex flex-col gap-[var(--space-6)]">
          {isError ? (
            <InlineAlert variant="danger" title="Could not load settings">
              Preferences could not be read.{" "}
              <button className="rounded-[var(--radius-xs)] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]" onClick={() => void refetch()}>
                Try again
              </button>
            </InlineAlert>
          ) : denied ? (
            <EmptyState
              heading="Settings access denied"
              description="ZenDisk cannot read or save preferences until access is restored."
              action={<Button onClick={() => void refetch()}>Try again</Button>}
            />
          ) : loading ? (
            <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sections.length === 0 ? (
            <EmptyState heading="No settings available" description="No preference groups were found." />
          ) : (
            <div className="grid gap-[var(--space-6)] desktop:grid-cols-[220px_1fr]">
              <nav aria-label="Settings sections" className="flex flex-col gap-[var(--space-2)]">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Find a setting"
                />
                <div className="flex flex-col gap-[var(--space-1)] rounded-[var(--radius-lg)] border border-border bg-surface p-[var(--space-2)]">
                  {filtered.map((item) => (
                    <Button
                      key={item.key}
                      variant={item.key === section ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      aria-current={item.key === section ? "page" : undefined}
                      onClick={() => setSection(item.key)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </nav>

              {query.trim() !== "" && filtered.length === 0 ? (
                <EmptyState
                  heading="No matching settings"
                  description="Try a different section name."
                />
              ) : (
                <Section
                  title={active?.label ?? "Settings"}
                  description={active?.description ?? "Choose a section."}
                >
                  <ActiveComponent />
                </Section>
              )}
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
