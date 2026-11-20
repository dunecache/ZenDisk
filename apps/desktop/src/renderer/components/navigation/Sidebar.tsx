import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton, Separator, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import {
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COLLAPSED,
  useSidebarStore,
} from "@/stores";
import { bottomNav, primaryNav, type NavItem } from "./nav-config";

export interface SidebarProps {
  /** Root-level path used for the brand link. */
  homeTo?: string;
}

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          "group relative flex h-[var(--control-height)] items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] text-[length:var(--text-body)] text-muted transition-colors duration-[var(--duration-hover)] hover:bg-surface-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)]",
          collapsed && "justify-center px-0",
          isActive && "bg-accent/20 text-primary hover:bg-accent/25 hover:text-primary",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
            />
          )}
          <Icon size={18} className="shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">
        {item.label}
        {item.shortcut && (
          <span className="ml-[var(--space-2)] text-muted">{item.shortcut}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

/** Left navigation rail. Width and collapsed state persist across sessions. */
export function Sidebar({ homeTo = "/overview" }: SidebarProps) {
  const collapsed = useSidebarStore((state) => state.collapsed);
  const width = useSidebarStore((state) => state.width);
  const toggleCollapsed = useSidebarStore((state) => state.toggleCollapsed);

  return (
    <aside
      aria-label="Primary navigation"
      className="flex h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-[var(--duration-sidebar)] ease-[var(--ease-layout)]"
      style={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : width }}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-[var(--header-height)] shrink-0 items-center border-b border-border px-[var(--space-4)]",
          collapsed && "justify-center px-0",
        )}
      >
        <NavLink to={homeTo} className="flex items-center gap-[var(--space-3)]">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-foreground text-[length:var(--text-h3)] font-semibold"
          >
            Z
          </span>
          {!collapsed && (
            <span className="text-[length:var(--text-h3)] font-semibold tracking-tight">
              ZenDisk
            </span>
          )}
        </NavLink>
        {!collapsed && (
          <IconButton
            label="Collapse sidebar"
            onClick={toggleCollapsed}
            className="ml-auto"
            variant="ghost"

          >
            <PanelLeftClose size={16} aria-hidden="true" />
          </IconButton>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 overflow-y-auto p-[var(--space-3)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          {primaryNav.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom navigation */}
      <div className="p-[var(--space-3)]">
        <Separator className="mb-[var(--space-2)]" />
        <div className="flex flex-col gap-[var(--space-1)]">
          {bottomNav.map((item) => (
            <NavItemLink key={item.to} item={item} collapsed={collapsed} />
          ))}
          {collapsed && (
            <IconButton
              label="Expand sidebar"
              onClick={toggleCollapsed}
              variant="ghost"
  
              className="mt-[var(--space-1)]"
            >
              <PanelLeftOpen size={16} aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>
    </aside>
  );
}
