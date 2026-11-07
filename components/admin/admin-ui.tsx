import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, MemberStatus } from "@/lib/firebase/collections";
import type { InquiryStatus } from "@/lib/inquiries";

/*
  THE ADMIN'S WORKSPACE PARTS — ADMIN ONLY. Never import these on the public
  site or in the member portal; both keep the brand's reading conventions.

  The admin is a tool staff live in, so it follows the conventions of good
  tools (Linear, Vercel's dashboard) on top of the brand's palette, type and
  square corners:
    · dense rows (44px), real column headers, sortable where it helps;
    · labels in sentence-case Rubik, not tracked uppercase mono — mono
      eyebrows orient a reader on a page, and a 12px gray caps label on
      every block is slow to scan in a tool;
    · status as a marker + a word, not a tinted chip — and a column that
      would say the same thing on every row (the stage you're filtered to)
      isn't shown at all.
*/

/** Section and group labels: sentence case, 13px, medium. Pair with a color. */
export const ADMIN_LABEL = "text-[13px] font-medium";
/** Tiny chips (a plan, a tag). Not prose — 12px is the floor. */
export const ADMIN_CHIP = "inline-flex items-center border border-border px-1.5 text-xs leading-5 text-graphite whitespace-nowrap";

// ─── Status ──────────────────────────────────────────────────────────────────

/*
  A square marker (the brand's corners) and the word. Colors say WHAT KIND of
  state, and only one of them means trouble:
    todo      Clay — waiting on us. Normal work, not an error.
    progress  amber — partway through.
    done      green — finished, good.
    info      blue — a passing state (trialing).
    danger    Geekdom Red — something is actually wrong (past due). Red's
              reserved jobs include errors; this is one.
    closed    hollow — over, nothing to do (declined, paused, canceled).
    blocked   Graphite — banned.
  The three hexes are the admin status colors badge.tsx documents.
*/
const MARK = {
  todo: "bg-clay",
  progress: "bg-[#e0a00d]",
  done: "bg-[#3f9a6e]",
  info: "bg-[#4f97c9]",
  danger: "bg-geekdom-red",
  closed: "border border-muted-foreground",
  blocked: "bg-graphite",
} as const;
export type StatusKind = keyof typeof MARK;

export function Status({ kind, children, className }: { kind: StatusKind; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap text-sm text-graphite", className)}>
      <span aria-hidden="true" className={cn("h-2 w-2 shrink-0", MARK[kind])} />
      {children}
    </span>
  );
}

const APPLICATION: Record<ApplicationStatus, [StatusKind, string]> = {
  initial_review: ["todo", "Initial review"],
  team_review: ["progress", "Team review"],
  approved: ["done", "Approved"],
  declined: ["closed", "Declined"],
  banned: ["blocked", "Banned"],
};
export const ApplicationStatusLabel = ({ status }: { status: ApplicationStatus }) => (
  <Status kind={APPLICATION[status][0]}>{APPLICATION[status][1]}</Status>
);

const MEMBER: Record<MemberStatus, [StatusKind, string]> = {
  active: ["done", "Active"],
  trialing: ["info", "Trialing"],
  past_due: ["danger", "Past due"],
  canceled: ["closed", "Canceled"],
  inactive: ["closed", "Paused"],
};
export const MemberStatusLabel = ({ status }: { status: MemberStatus }) => (
  <Status kind={MEMBER[status][0]}>{MEMBER[status][1]}</Status>
);

const INQUIRY: Record<InquiryStatus, [StatusKind, string]> = {
  new: ["todo", "New"],
  accepted: ["done", "Accepted"],
  declined: ["closed", "Declined"],
};
export const InquiryStatusLabel = ({ status }: { status: InquiryStatus }) => (
  <Status kind={INQUIRY[status][0]}>{INQUIRY[status][1]}</Status>
);

// ─── Tables ──────────────────────────────────────────────────────────────────

/*
  A real <table>: headers are announced with each cell, and columns line up
  under their headers. FIXED LAYOUT: each <Th> sets its column's width
  (w-28…), the one without a width takes the rest, and long text truncates
  instead of pushing the row taller. Rows are 44px. The header sticks while the list
  scrolls (the admin has no top bar on desktop, so top-0). On a phone the
  table scrolls sideways; pages hide their least useful columns below md.
*/
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto border border-border bg-bone-light md:overflow-visible", className)}>
      <table className="w-full table-fixed border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export type SortDir = "asc" | "desc";

/**
 * A column header. Sortable when given `sort`: a link (server pages, the
 * sort lives in the URL) or a button (client lists).
 */
export function Th({
  children,
  className,
  align = "left",
  sort,
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
  sort?: { dir: SortDir | null; href?: string; onClick?: () => void };
}) {
  const Arrow = sort?.dir === "asc" ? ArrowUp : ArrowDown;
  const inner = (
    <>
      {children}
      {sort && (
        <Arrow
          aria-hidden="true"
          className={cn("h-3 w-3 shrink-0", sort.dir ? "text-graphite" : "opacity-0 group-hover/th:opacity-50")}
          strokeWidth={2}
        />
      )}
    </>
  );
  const control = "group/th inline-flex items-center gap-1 hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay";
  return (
    <th
      scope="col"
      aria-sort={sort?.dir === "asc" ? "ascending" : sort?.dir === "desc" ? "descending" : undefined}
      className={cn(
        "sticky top-0 z-10 h-9 border-b border-border bg-bone-light px-4 font-medium whitespace-nowrap text-muted-foreground",
        "text-[13px]",
        align === "right" && "text-right",
        className,
      )}
    >
      {sort?.href ? (
        <Link href={sort.href} scroll={false} className={control}>
          {inner}
        </Link>
      ) : sort?.onClick ? (
        <button type="button" onClick={sort.onClick} className={control}>
          {inner}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

/** A row. The whole row is the target: its first cell carries a stretched link or button. */
export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("relative h-11 border-t border-border transition-colors first:border-t-0 hover:bg-bone", className)}>
      {children}
    </tr>
  );
}

export function Td({ children, className, align = "left" }: { children?: React.ReactNode; className?: string; align?: "left" | "right" }) {
  return (
    <td className={cn("truncate px-4 py-0 align-middle text-graphite", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}

const STRETCH =
  "font-medium text-graphite after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-clay";

/** The row's link (put it in the first cell). */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={STRETCH}>
      {children}
    </Link>
  );
}

/** The row's button, for lists that open a drawer. */
export function RowButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(STRETCH, "text-left")}>
      {children}
    </button>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

/** Underlined tabs with counts — a stage, a kind, a status. Links, so each view has an address. */
export function Tabs({
  label,
  items,
  className,
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("flex gap-6 overflow-x-auto border-b border-border", className)}>
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors",
            t.active ? "border-clay text-graphite" : "border-transparent text-muted-foreground hover:text-graphite",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="tabular-nums text-muted-foreground">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

/** A quieter second row of filters under Tabs (Requests' statuses). */
export function Segments({
  label,
  items,
  className,
}: {
  label: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("inline-flex border border-border bg-bone-light", className)}>
      {items.map((t, i) => (
        <Link
          key={t.href}
          href={t.href}
          scroll={false}
          aria-current={t.active ? "true" : undefined}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
            i > 0 && "border-l border-border",
            t.active ? "bg-graphite text-bone" : "text-muted-foreground hover:text-graphite",
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="tabular-nums opacity-70">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

// ─── Dates in a column ───────────────────────────────────────────────────────

/** "Nov 3" this year, "Oct 22, 2025" otherwise — short enough for a column, never ambiguous. */
export function tableDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const tz = "America/Chicago";
  const year = (x: Date) => new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric" }).format(x);
  const same = year(d) === year(new Date());
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", ...(same ? {} : { year: "numeric" }) }).format(d);
}
