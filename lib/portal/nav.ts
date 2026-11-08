// The portal's navigation model — shared by the sidebar and the mobile drawer.

import {
  BookOpen,
  CalendarDays,
  Contact,
  History,
  DoorOpen,
  Images,
  Inbox,
  LayoutGrid,
  MessageSquare,
  NotebookPen,
  Shapes,
  ShieldCheck,
  Type,
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
      // Phase 4: the conference rooms (lib/rooms/).
      { href: "/portal/rooms", label: "Book a room", short: "Rooms", icon: DoorOpen },
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
/*
  GROUPED BY THE KIND OF WORK:
    Reviews       — things waiting on a yes or no (applications, requests)
    Members       — the people (the roster, what members read)
    Site content  — what the public site shows
    Settings      — the admin itself: who can sign in (Admin access) and
                    what they did (Activity log). Admin access sat under
                    Members, but it's about Geekdom's team, not the Club.
  Invitations is NOT here: it's the launch tool for members who joined
  before the workflow existed, so it's a button on the Members page (and
  lives under /members, which keeps Members highlighted while it's open).
*/
export const ADMIN_NAV: NavGroup[] = [
  {
    items: [{ href: "/portal/admin", label: "Overview", icon: LayoutGrid }],
  },
  {
    label: "Reviews",
    items: [
      { href: "/portal/admin/applications", label: "Applications", icon: Inbox },
      // Event requests (/club) and Studio partner requests (/studio).
      { href: "/portal/admin/requests", label: "Requests", icon: MessageSquare },
    ],
  },
  {
    label: "Members",
    items: [
      { href: "/portal/admin/members", label: "Members", icon: Users },
      // Conference-room bookings and the rooms themselves.
      { href: "/portal/admin/rooms", label: "Rooms", icon: DoorOpen },
      // What members read on FAQ & resources, and the dashboard's Slack tile.
      { href: "/portal/admin/resources", label: "Member resources", icon: BookOpen },
    ],
  },
  {
    label: "Site content",
    items: [
      // BY HOW OFTEN THEY'RE USED: events expire and need weekly attention,
      // Field Notes are regular work; the wall and the photo archive are
      // mostly set once.
      // The words on the public pages — the scope of work's "maintain
      // website content without developer assistance".
      { href: "/portal/admin/copy", label: "Site copy", icon: Type },
      { href: "/portal/admin/events", label: "Events", icon: CalendarDays },
      { href: "/portal/admin/field-notes", label: "Field Notes", icon: NotebookPen },
      { href: "/portal/admin/portfolio", label: "Portfolio", icon: Shapes },
      { href: "/portal/admin/gallery", label: "Photo archive", icon: Images },
    ],
  },
  {
    // About the admin itself, not the Club — last, like Linear's and
    // Vercel's settings: who can sign in, and the record of what they did.
    label: "Settings",
    items: [
      // Who can sign in to this admin — owners manage it.
      { href: "/portal/admin/team", label: "Admin access", icon: ShieldCheck },
      { href: "/portal/admin/activity", label: "Activity log", icon: History },
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
