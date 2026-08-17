// Admin navigation model — shared by the sidebar and the mobile drawer.

import {
  LayoutGrid,
  Inbox,
  Users,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/applications", label: "Applications", icon: Inbox },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
];

/**
 * Longest-prefix match, so /admin/applications/abc123 highlights Applications
 * rather than Dashboard. A plain `startsWith` would match "/admin" for every
 * route and light up the whole sidebar.
 */
export function activeHref(pathname: string): string | null {
  const match = NAV.filter(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/"),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? null;
}
