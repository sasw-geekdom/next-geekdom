"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Menu, ShieldCheck, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import {
  ADMIN_NAV,
  ADMIN_ROOT,
  MEMBER_NAV,
  activeHref,
  inAdmin,
  type NavGroup,
} from "@/lib/portal/nav";
import { isAdmin, type SessionUser } from "@/lib/auth/roles";
import { Logo } from "@/components/site/logo";
import { AccountMenu } from "@/components/portal/account-menu";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

/*
  THE PORTAL'S FRAME, for members and staff alike.

  TWO LAYOUTS. The MEMBER portal is a TOP BAR, like the public site — four
  pages don't need a 256px rail, and the directory in particular needs the
  width. Phones get a bottom tab bar (next-angels' pattern). The ADMIN keeps
  the SIDEBAR: seven sections in groups is a workspace, and a rail suits it.

  Staff see a LABELED SWITCH — "Admin portal", and "Member portal" to
  come back — that swaps the sidebar to the admin pages. It was a bare wrench
  icon: it read as "settings", which is a member's own thing once members
  have settings, and an icon with no word has to be guessed. A shield says
  staff access; the word says where it goes. Icon-only on the phone bar,
  where there's no room, with the label in the menu.

  Rendered only when the session's role is staff or superadmin — but hiding
  it is UX, not the gate: every /portal/admin page and server action calls
  `requireAdmin()` on the server.

  The site's brand, not a dashboard kit: Bone grounds, a Bone Light rail,
  square corners on everything, Plex Mono for labels, Rubik for the rest.
*/
export function PortalShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const memberItems = MEMBER_NAV.flatMap((g) => g.items);
  const [open, setOpen] = React.useState(false);
  const staff = isAdmin(user);
  const admin = staff && inAdmin(pathname);
  const groups: NavGroup[] = admin ? ADMIN_NAV : MEMBER_NAV;
  const active = activeHref(pathname, groups);

  // Close the mobile drawer on navigation, adjusted during render rather than
  // in an effect — see the longer note in components/site/site-navbar.tsx.
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  async function onSignOut() {
    // Both halves matter: DELETE clears the httpOnly cookie the server checks,
    // and signOut clears the Firebase client session. Skipping the second one
    // means the next visit to /sign-in silently re-authenticates.
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(getFirebaseAuth()).catch(() => {});
    router.replace("/sign-in");
    router.refresh();
  }

  const switchHref = admin ? "/portal" : ADMIN_ROOT;
  const switchRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light";

  /** The phone bar's version: the shield alone, filled while in the admin. */
  const switchIcon = staff && (
    <Link
      href={switchHref}
      aria-label={admin ? "Back to the member portal" : "Admin portal"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center border transition-colors",
        switchRing,
        admin
          ? "border-graphite bg-graphite text-bone hover:bg-graphite-soft"
          : "border-border text-graphite hover:border-graphite",
      )}
    >
      <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
    </Link>
  );

  /** The sidebar's version: icon and word, full width. */
  const switchLabeled = staff && (
    <Link
      href={switchHref}
      className={cn(
        "group flex items-center gap-2.5 border border-border bg-bone px-3 py-2.5 text-sm font-medium text-graphite transition-colors hover:border-graphite",
        switchRing,
      )}
    >
      {admin ? (
        <>
          <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.7} />
          Member portal
        </>
      ) : (
        <>
          <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={1.7} />
          <span className="flex-1">Admin portal</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={1.7} />
        </>
      )}
    </Link>
  );

  /* ── The member portal: top bar + phone tab bar ───────────────────── */
  if (!admin) {
    return (
      <div className="flex min-h-screen flex-col bg-bone">
        <header className="sticky top-0 z-30 border-b border-border bg-bone">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-6 lg:px-10">
            {/*
              NAMED AS THE MEMBER PORTAL, beside the wordmark — the bare
              wordmark read as the public site, so nothing said you were
              signed in. A hairline, then the label in Plex Mono: the admin
              sidebar says "Admin portal" under its wordmark the same way.
            */}
            <Link href="/portal" aria-label="Member portal home" className="flex shrink-0 items-center gap-3">
              <Logo title="" className="h-8 w-auto" />
              <span aria-hidden="true" className="h-5 w-px bg-border" />
              <span className={cn(MONO.label, "text-muted-foreground")}>Member portal</span>
            </Link>
            <nav aria-label="Portal" className="hidden h-full items-stretch gap-6 md:flex">
              {memberItems.map((item) => {
                const isActive = active === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      // The active page gets a Clay rule along the bar's
                      // bottom edge — the sidebar's marker, turned 90°.
                      "flex items-center border-b-2 text-sm transition-colors",
                      isActive
                        ? "border-clay font-medium text-graphite"
                        : "border-transparent text-graphite/70 hover:text-graphite",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              {staff && (
                <>
                  <span className="md:hidden">{switchIcon}</span>
                  <Link
                    href={ADMIN_ROOT}
                    className={cn(
                      "hidden items-center gap-2 border border-border px-3 py-2 text-sm font-medium text-graphite transition-colors hover:border-graphite md:inline-flex",
                      switchRing,
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.7} />
                    Admin portal
                  </Link>
                </>
              )}
              {/* Name, Profile, Admin portal and Sign out, together. */}
              <AccountMenu
                name={user.name}
                email={user.email}
                staff={staff}
                adminHref={ADMIN_ROOT}
                onSignOut={onSignOut}
              />
            </div>
          </div>
        </header>

        {/* pb on phones clears the fixed tab bar */}
        <main className="mx-auto w-full max-w-7xl flex-1 pb-20 md:pb-0">{children}</main>

        <nav
          aria-label="Portal"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-bone md:hidden"
        >
          {memberItems.map((item) => {
            const isActive = active === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 border-t-2 py-2.5 text-[11px]",
                  isActive ? "border-clay text-graphite" : "border-transparent text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.6} />
                {item.short ?? item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    );
  }

  /* ── The admin: sidebar ─────────────────────────────────────────────── */
  return (
    <div className="flex min-h-screen flex-col bg-bone lg:flex-row">
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-border bg-bone-light px-4 py-3 lg:hidden">
        <Link href="/portal" aria-label="Portal home">
          <Logo title="" className="h-8 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          {switchIcon}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="portal-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className={buttonClass("ghost", "icon")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        id="portal-nav"
        className={cn(
          "shrink-0 flex-col border-border bg-bone-light lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:border-r",
          open ? "flex border-b" : "hidden",
        )}
      >
        <div className="hidden px-6 pb-5 pt-6 lg:block">
          <Link href="/portal" aria-label="Portal home">
            <Logo title="" className="h-8 w-auto" />
          </Link>
          <p className={cn(MONO.label, "mt-2 text-muted-foreground")}>
            {admin ? "Admin portal" : "Member portal"}
          </p>
        </div>
        {switchLabeled && <div className="px-3 pt-3 lg:pb-5 lg:pt-0">{switchLabeled}</div>}

        <nav aria-label={admin ? "Admin" : "Portal"} className="px-3 py-3 lg:py-0">
          {groups.map((group, i) => (
            <div key={group.label ?? i} className={cn(i > 0 && "mt-6")}>
              {group.label && (
                <p className={cn(MONO.label, "px-3 pb-2 text-muted-foreground")}>
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col">
                {group.items.map((item) => {
                  const isActive = active === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          // Square, with a Clay rule on the active row rather
                          // than a tinted pill: the accent is a marker, the
                          // words stay Graphite (Clay can't carry small text).
                          "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors",
                          isActive
                            ? "border-clay bg-bone font-medium text-graphite"
                            : "border-transparent text-graphite/70 hover:bg-bone hover:text-graphite",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

        </nav>

        {/*
          THE SAME ACCOUNT MENU AS THE MEMBER TOP BAR, at the foot of the
          rail. It was name, email, a "Staff" label and two loose text links —
          a different pattern for the same job. Opens upward here.
        */}
        <div className="mt-6 border-t border-border px-3 py-4 lg:mt-auto">
          <AccountMenu
            name={user.name}
            email={user.email}
            staff={staff}
            adminHref={ADMIN_ROOT}
            onSignOut={onSignOut}
            placement="up"
          />
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
