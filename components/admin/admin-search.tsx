"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { ADMIN_LABEL, ApplicationStatusLabel, InquiryStatusLabel, MemberStatusLabel, RowLink, Table, Td, Tr } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, MemberStatus } from "@/lib/firebase/collections";
import type { InquiryStatus } from "@/lib/inquiries";

/*
  ADMIN SEARCH, AS YOU TYPE (Jesse: "I don't see any real time results").
  The page hands over the three lists once, slimmed to what's searched and
  shown (app/portal/admin/search/page.tsx); filtering is instant in the
  browser, like the directory and Members. `?q=` follows the box with
  replaceState, so a search can be linked and reloaded without a history
  entry per letter.
*/

export interface SearchRow {
  id: string;
  name: string;
  email: string;
  /** Searched too: company, city. */
  extra: string;
  href: string;
  /** The third column: joined, applied, or the request kind. */
  meta: string;
  status: { kind: "member"; value: MemberStatus } | { kind: "application"; value: ApplicationStatus } | { kind: "request"; value: InquiryStatus };
}

const LIMIT = 15;
const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function AdminSearch({ initial, members, applications, requests }: { initial: string; members: SearchRow[]; applications: SearchRow[]; requests: SearchRow[] }) {
  const [q, setQ] = React.useState(initial);
  const needle = q.trim().toLowerCase();

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (needle) url.searchParams.set("q", q.trim());
    else url.searchParams.delete("q");
    window.history.replaceState(window.history.state, "", url);
  }, [q, needle]);

  const match = (r: SearchRow) => [r.name, r.email, r.extra].some((f) => f.toLowerCase().includes(needle));
  const groups = needle.length >= 2
    ? ([
        ["Members", members.filter(match)],
        ["Applications", applications.filter(match)],
        ["Requests", requests.filter(match)],
      ] as const)
    : [];
  const total = groups.reduce((n, [, rows]) => n + rows.length, 0);

  return (
    <div>
      <div className="relative max-w-2xl" role="search">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.7} />
        <label htmlFor="admin-search" className="sr-only">
          Search the admin
        </label>
        <input
          id="admin-search"
          type="search"
          value={q}
          autoFocus
          autoComplete="off"
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a name, email or company — press / anywhere in the admin"
          className="h-11 w-full border border-border bg-bone-light pl-10 pr-10 text-base text-graphite placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-graphite">
            <X className="h-4 w-4" strokeWidth={1.7} />
          </button>
        )}
      </div>

      {/* Announced as results change, for screen readers. */}
      <p role="status" className="mt-6 text-sm text-muted-foreground">
        {needle.length === 0
          ? `${count(members.length, "member")}, ${count(applications.length, "application")} and ${count(requests.length, "request")} to search.`
          : needle.length < 2
            ? "Keep typing — two letters or more."
            : total === 0
              ? `Nothing matches “${q.trim()}” in members, applications or requests.`
              : `${total} ${total === 1 ? "match" : "matches"}`}
      </p>

      {groups.map(([title, rows]) =>
        rows.length === 0 ? null : (
          <section key={title} className="mt-6">
            <h2 className={cn(ADMIN_LABEL, "mb-2 text-graphite")}>
              {title} <span className="ml-1 tabular-nums font-normal text-muted-foreground">{rows.length > LIMIT ? `${LIMIT} of ${rows.length}` : rows.length}</span>
            </h2>
            <Table>
              <tbody>
                {rows.slice(0, LIMIT).map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium">
                      <RowLink href={r.href}>{r.name}</RowLink>
                    </Td>
                    <Td className="hidden text-muted-foreground md:table-cell">{r.email}</Td>
                    <Td className="hidden text-muted-foreground lg:table-cell">{r.meta}</Td>
                    <Td align="right">
                      {r.status.kind === "member" ? (
                        <MemberStatusLabel status={r.status.value} />
                      ) : r.status.kind === "application" ? (
                        <ApplicationStatusLabel status={r.status.value} />
                      ) : (
                        <InquiryStatusLabel status={r.status.value} />
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </section>
        ),
      )}
    </div>
  );
}

