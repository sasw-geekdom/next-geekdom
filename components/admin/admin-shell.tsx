"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { NAV, activeHref } from "@/lib/admin/nav";
import type { AdminUser } from "@/lib/auth/roles";
import { Logo } from "@/components/site/logo";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const active = activeHref(pathname);

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
    // means the next visit to /admin/login silently re-authenticates.
    await fetch("/api/auth/session", { method: "DELETE" });
    await signOut(getFirebaseAuth()).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand lg:flex-row">
      {/* Mobile bar */}
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <Link href="/admin">
          <Logo className="h-8" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className={buttonClass("ghost", "icon")}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        id="admin-nav"
        className={cn(
          "shrink-0 border-border bg-white lg:block lg:w-60 lg:border-r",
          open ? "block border-b" : "hidden",
        )}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Link href="/admin">
            <Logo className="h-8" />
          </Link>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            Staff portal
          </p>
        </div>

        <nav aria-label="Admin" className="px-3 py-3 lg:py-0">
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const isActive = active === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-rust/10 text-rust-deep"
                        : "text-ink/70 hover:bg-sand-deep hover:text-ink",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 border-t border-border px-5 py-4 lg:mt-auto">
          <p className="truncate text-sm font-medium text-ink">
            {user.name ?? user.email}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          {user.role === "superadmin" && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-rust">
              Superadmin
            </p>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-rust"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.7} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
