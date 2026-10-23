"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  THE ACCOUNT MENU — your name in the top bar opens it.

  It replaced a bare sign-out icon (a door with an arrow) parked at the far
  edge of the bar, apart from the name it belonged to: an icon that had to
  be guessed, in the wrong place. Now identity and its actions sit together —
  who you're signed in as, Profile, Admin portal (staff), and "Sign out"
  spelled out.

  A custom menu, not a native one, per the portal's rule. Opens on click,
  closes on outside press, Escape (focus back to the button) or Tab; arrow
  keys move between items. `role="menu"` + `menuitem`s.
*/

function initials(name: string) {
  return name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export function AccountMenu({
  name,
  email,
  staff,
  adminHref,
  onSignOut,
  placement = "down",
}: {
  name: string | null;
  email: string;
  staff: boolean;
  adminHref: string;
  onSignOut: () => void;
  /**
   * "down" — the member portal's top bar. "up" — the admin sidebar's foot,
   * where the menu opens upward, spans the rail, and lists the public site
   * instead of the Admin portal (you're in it; the rail's switch goes back).
   */
  placement?: "down" | "up";
}) {
  const inSidebar = placement === "up";
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();
  const display = name || email;

  const close = React.useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown, true);
    // Focus the first item on open, so the arrow keys work straight away.
    root.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus({ preventScroll: true });
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, close]);

  function onMenuKey(e: React.KeyboardEvent) {
    const items = [...(root.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Tab") {
      close();
    }
  }

  const item =
    "flex w-full items-center gap-3 border-l-2 border-transparent px-4 py-2.5 text-left text-sm text-graphite outline-none hover:border-clay hover:bg-bone focus-visible:border-clay focus-visible:bg-bone";

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Account: ${display}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-border",
          inSidebar && "w-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone",
          open && "border-border",
        )}
      >
        <span aria-hidden="true" className={cn(MONO.micro, "flex h-8 w-8 shrink-0 items-center justify-center bg-graphite text-bone")}>
          {initials(display)}
        </span>
        <span className={cn("max-w-44 truncate text-left text-sm text-graphite", inSidebar ? "min-w-0 flex-1" : "hidden lg:inline")}>
          {display}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn("h-4 w-4 text-muted-foreground transition-transform duration-150", open && "rotate-180")}
          strokeWidth={1.7}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKey}
          className={cn(
            "absolute z-40 border border-border bg-bone-light py-2 shadow-lg",
            inSidebar ? "bottom-full left-0 right-0 mb-2" : "right-0 top-full mt-2 w-64",
          )}
        >
          <div className="border-b border-border px-4 pb-3 pt-1">
            <p className="truncate text-sm font-medium text-graphite">{display}</p>
            {name && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
          <div className="py-1">
            <Link href="/portal/profile" role="menuitem" className={item} onClick={() => close()}>
              <UserRound className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} aria-hidden="true" />
              Profile
            </Link>
            {staff && !inSidebar && (
              <Link href={adminHref} role="menuitem" className={item} onClick={() => close()}>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} aria-hidden="true" />
                Admin portal
              </Link>
            )}
            {inSidebar && (
              <a href="/" target="_blank" rel="noreferrer noopener" role="menuitem" className={item} onClick={() => close()}>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} aria-hidden="true" />
                Public site
              </a>
            )}
          </div>
          <div className="border-t border-border pt-1">
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                close();
                onSignOut();
              }}
            >
              <LogOut className="h-4 w-4 text-muted-foreground" strokeWidth={1.7} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
