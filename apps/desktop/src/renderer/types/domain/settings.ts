export type SettingsSectionKey =
  | "general"
  | "appearance"
  | "notifications"
  | "cleanup"
  | "organization"
  | "storage"
  | "privacy"
  | "license"
  | "updates";

export interface SettingsSectionMeta {
  key: SettingsSectionKey;
  label: string;
  description: string;
}

export interface SettingsData {
  access: "granted" | "denied";
  sections: SettingsSectionMeta[];
  currentVersion: string;
  /** The updater UI arrives with native integration in Phase 6.6. */
  updatesEnabled: boolean;
}
