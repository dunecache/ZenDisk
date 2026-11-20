import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout";
import { PlaceholderScreen } from "./PlaceholderScreen";
import { OverviewScreen } from "@/features/overview";
import { DiskAnalysisScreen } from "@/features/disk-analysis";
import { CleanupScreen } from "@/features/cleanup";
import { DuplicatesScreen } from "@/features/duplicates";
import { OrganizationScreen } from "@/features/organization";
import { defaultRoute } from "@/components/navigation";

const screens = [
  { path: "/overview", title: "Overview" },
  { path: "/disk-analysis", title: "Disk analysis" },
  { path: "/cleanup", title: "Cleanup" },
  { path: "/organization", title: "Organization" },
  { path: "/duplicates", title: "Duplicates" },
  { path: "/maintenance", title: "Maintenance" },
  { path: "/automation", title: "Automation" },
  { path: "/reports", title: "Reports" },
  { path: "/settings", title: "Settings" },
  { path: "/license", title: "License and plan" },
  { path: "/help", title: "Help" },
];

/** Route table. Screens are placeholders until Phases 3–4 implement them. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell version="0.0.0" />}>
        <Route index element={<Navigate to={defaultRoute} replace />} />
        <Route path="/overview" element={<OverviewScreen />} />
        <Route path="/disk-analysis" element={<DiskAnalysisScreen />} />
        <Route path="/cleanup" element={<CleanupScreen />} />
        <Route path="/duplicates" element={<DuplicatesScreen />} />
        <Route path="/organization" element={<OrganizationScreen />} />
        {screens
          .filter((screen) => !["/overview", "/disk-analysis", "/cleanup", "/duplicates", "/organization"].includes(screen.path))
          .map((screen) => (
            <Route
              key={screen.path}
              path={screen.path}
              element={
                <PlaceholderScreen
                  title={screen.title}
                  breadcrumbs={[{ label: "ZenDisk" }, { label: screen.title }]}
                />
              }
            />
          ))}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Route>
    </Routes>
  );
}
