import {
  Activity,
  BarChart3,
  CircleHelp,
  Copy,
  FolderCog,
  HardDrive,
  LayoutDashboard,
  Settings,
  Sparkles,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Shortcut hint for the tooltip, from Spec.md §34. */
  shortcut?: string;
}

export const primaryNav: NavItem[] = [
  { label: "Overview", to: "/overview", icon: LayoutDashboard, shortcut: "Ctrl 1" },
  { label: "Disk analysis", to: "/disk-analysis", icon: HardDrive, shortcut: "Ctrl 2" },
  { label: "Cleanup", to: "/cleanup", icon: Sparkles },
  { label: "Organization", to: "/organization", icon: FolderCog },
  { label: "Duplicates", to: "/duplicates", icon: Copy },
  { label: "Maintenance", to: "/maintenance", icon: Activity },
  { label: "Automation", to: "/automation", icon: Workflow },
  { label: "Reports", to: "/reports", icon: BarChart3 },
];

export const bottomNav: NavItem[] = [
  { label: "Settings", to: "/settings", icon: Settings, shortcut: "Ctrl ," },
  { label: "License and plan", to: "/license", icon: Sparkles },
  { label: "Help", to: "/help", icon: CircleHelp },
];

export const defaultRoute = "/overview";
