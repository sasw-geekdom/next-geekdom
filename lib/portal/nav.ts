// The portal's navigation model — shared by the sidebar and the mobile drawer.

import {
  BookOpen,
  CalendarDays,
  Contact,
  Images,
  Inbox,
  LayoutGrid,
  NotebookPen,
  Shapes,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** A shorter label for the phone tab bar, where four sit side by side. */
  short?: string;
}

export interface NavGroup {
  /** Omitted for a single ungrouped list. */
  label?: string;
  items: NavItem[];
}

/*
  WHAT A MEMBER SEES. The directory and FAQ render sample content for design
  review (data/mock/portal.ts) until their real versions are built.
*/
export const MEMBER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/portal", label: "Dashboard", short: "Home", icon: LayoutGrid },
      { href: "/portal/directory", label: "Directory", icon: Contact },
      { href: "/portal/resources", label: "FAQ & resources", short: "FAQ", icon: BookOpen },
      { href: "/portal/profile", label: "Profile", icon: UserRound },
    ],
  },
];

/*
  WHAT THE ADMIN SWITCH OPENS. Staff only — rendered when the session's role is
  staff or superadmin, and every page under /portal/admin re-checks that on
  the server. Hiding the Admin switch is UX; it is not the gate.
*/
export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Members",
    items: [
      { href: "/portal/admin", label: "Overview", icon: LayoutGrid },
      { href: "/portal/admin/applications", label: "Applications", icon: Inbox },
      { href: "/portal/admin/members", label: "Members", icon: Users },
    ],
  },
  {
    label: "Site content",
    items: [
      // BY HOW OFTEN THEY'RE USED: events expire and need weekly attention,
      // Field Notes are regular work; the wall and the photo archive are
      // mostly set once.
      { href: "/portal/admin/events", label: "This month", icon: CalendarDays },
      { href: "/portal/admin/field-notes", label: "Field Notes", icon: NotebookPen },
      { href: "/portal/admin/portfolio", label: "Built at Geekdom", icon: Shapes },
      { href: "/portal/admin/gallery", label: "Photo wall", icon: Images },
    ],
  },
];

export const ADMIN_ROOT = "/portal/admin";

export function inAdmin(pathname: string): boolean {
  return pathname === ADMIN_ROOT || pathname.startsWith(ADMIN_ROOT + "/");
}

/**
 * Longest-prefix match, so /portal/admin/applications/abc123 highlights
 * Applications rather than Overview. A plain `startsWith` would match
 * "/portal" for every route and light up the whole sidebar.
 */
export function activeHref(pathname: string, groups: NavGroup[]): string | null {
  const match = groups
    .flatMap((g) => g.items)
    .filter((n) => pathname === n.href || pathname.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? null;
}
