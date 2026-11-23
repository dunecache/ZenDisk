import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Density = "comfortable" | "compact";
export type ConflictStrategy = "skip" | "ask";

/** Local mirror of preferences until Phase 6 persists them through the store plugin. */
export interface Preferences {
  density: Density;
  showSampleDataNotice: boolean;
  notifyCleanup: boolean;
  notifyDuplicates: boolean;
  notifyAutomation: boolean;
  notifyUpdates: boolean;
  cleanupUseRecycleBin: boolean;
  cleanupSkipSystemFolders: boolean;
  organizationPreviewBeforeApply: boolean;
  organizationConflictStrategy: ConflictStrategy;
  organizationDefaultDestination: string;
  storageScanOnStartup: boolean;
  storageExcludeNetworkDrives: boolean;
  storageSelectedDriveId: string;
  privacyTelemetry: boolean;
  privacyRememberPaths: boolean;
  privacyClearHistoryOnExit: boolean;
  licenseAutoRenew: boolean;
}

const defaults: Preferences = {
  density: "comfortable",
  showSampleDataNotice: true,
  notifyCleanup: true,
  notifyDuplicates: true,
  notifyAutomation: true,
  notifyUpdates: true,
  cleanupUseRecycleBin: true,
  cleanupSkipSystemFolders: true,
  organizationPreviewBeforeApply: true,
  organizationConflictStrategy: "ask",
  organizationDefaultDestination: "D:/Organized",
  storageScanOnStartup: false,
  storageExcludeNetworkDrives: true,
  storageSelectedDriveId: "C:",
  privacyTelemetry: false,
  privacyRememberPaths: true,
  privacyClearHistoryOnExit: false,
  licenseAutoRenew: false,
};

interface PreferencesState extends Preferences {
  set: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  reset: () => void;
}

const preferenceKeys = Object.keys(defaults) as (keyof Preferences)[];

/** Only persisted fields, never actions or transient state. */
export function preferencesFromStorage(state: Preferences): Preferences {
  return Object.fromEntries(preferenceKeys.map((key) => [key, state[key]])) as unknown as Preferences;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (key, value) => set({ [key]: value } as Partial<PreferencesState>),
      reset: () => set({ ...defaults }),
    }),
    {
      name: "zendisk-preferences",
      version: 1,
      partialize: (state) =>
        Object.fromEntries(preferenceKeys.map((key) => [key, state[key]])) as unknown as Preferences,
    },
  ),
);
