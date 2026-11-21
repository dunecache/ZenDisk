/**
 * Demo data for the Settings screen. Isolated here so native preference
 * storage is a one-line change in `hooks/data/useSettings.ts`.
 * Never import this from features directly.
 */
import { mockAccess } from "./mock-access";
import type { SettingsData } from "@/types";

export const settingsData: SettingsData = {
  access: mockAccess(),
  currentVersion: "0.0.0",
  updatesEnabled: false,
  sections: [
    { key: "general", label: "General", description: "Defaults and background behavior." },
    { key: "appearance", label: "Appearance", description: "Theme and interface density." },
    { key: "notifications", label: "Notifications", description: "Which results reach you." },
    { key: "cleanup", label: "Cleanup", description: "Safety defaults for removal." },
    { key: "organization", label: "Organization", description: "Rule application behavior." },
    { key: "storage", label: "Storage", description: "Scanned locations and drives." },
    { key: "privacy", label: "Privacy", description: "What ZenDisk remembers." },
    { key: "license", label: "License", description: "Plan and entitlement." },
    { key: "updates", label: "Updates", description: "Current version and signed updates." },
  ],
};

/** Simulated async fetch so loading/skeleton states are exercised in dev. */
export function fetchSettings(): Promise<SettingsData> {
  return new Promise((resolve) => setTimeout(() => resolve(settingsData), 200));
}
