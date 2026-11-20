import { Navigate, Route, Routes } from "react-router-dom";
import { AccessGate, AppShell } from "@/components/layout";
import { OverviewScreen } from "@/features/overview";
import { DiskAnalysisScreen } from "@/features/disk-analysis";
import { CleanupScreen } from "@/features/cleanup";
import { DuplicatesScreen } from "@/features/duplicates";
import { OrganizationScreen } from "@/features/organization";
import { MaintenanceScreen } from "@/features/maintenance";
import { AutomationScreen } from "@/features/automation";
import { ReportsScreen } from "@/features/reports";
import { SettingsScreen } from "@/features/settings";
import { LicenseScreen } from "@/features/license";
import { HelpScreen } from "@/features/help";
import { defaultRoute } from "@/components/navigation";
import { useAppVersion } from "@/hooks/data";

/** Route table for all Phase 3–4 screens. */
export function AppRoutes() {
  const { data: version } = useAppVersion();

  return (
    <Routes>
      <Route element={<AppShell version={version ?? "0.0.0"} />}>
        <Route index element={<Navigate to={defaultRoute} replace />} />
        <Route path="/overview" element={<AccessGate capability="drive information"><OverviewScreen /></AccessGate>} />
        <Route path="/disk-analysis" element={<AccessGate capability="disk contents"><DiskAnalysisScreen /></AccessGate>} />
        <Route path="/cleanup" element={<AccessGate capability="temporary files"><CleanupScreen /></AccessGate>} />
        <Route path="/duplicates" element={<AccessGate capability="file contents"><DuplicatesScreen /></AccessGate>} />
        <Route path="/organization" element={<AccessGate capability="file organization"><OrganizationScreen /></AccessGate>} />
        <Route path="/maintenance" element={<MaintenanceScreen />} />
        <Route path="/automation" element={<AutomationScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/license" element={<LicenseScreen />} />
        <Route path="/help" element={<HelpScreen />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Route>
    </Routes>
  );
}
