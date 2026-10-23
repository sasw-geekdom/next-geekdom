"use client";

import * as React from "react";
import { Globe, Search, X } from "lucide-react";
import { Input } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { HEADING, LINK, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { AUDIENCES } from "@/lib/membership";
import type { DirectoryMember } from "@/data/mock/portal";

/*
  THE MEMBER DIRECTORY, built for 400+ people — next-angels' master/detail.

  A card grid was tried first and doesn't scale: at three per row, 400
  members is 130 rows of tall cards, and the detail is a click away from
  every one. Instead:

    · a COMPACT ALPHABETICAL LIST on the left — one row per person (portrait,
      name, one line) under sticky letter headings, with an A–Z jump bar;
    · a PERSISTENT PROFILE PANE on the right (desktop), sticky, showing the
      selected member — so browsing is moving down a list, not opening and
      closing cards;
    · on a phone, the profile opens in the slide-out instead.

  Search covers names, companies, roles, headlines AND "Ask me about", so
  the question a member actually brings — "who here knows about X?" — is
  answered by typing X.

  Portraits are square (no rounding, like every frame on the site). Sample
  members get illustrations; members will upload their own photo.
*/

function letterOf(name: string) {
  const c = name.normalize("NFD").replace(/[̀-ͯ]/g, "").trim()[0]?.toUpperCase() ?? "#";
  return /[A-Z]/.test(c) ? c : "#";
}

function since(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Portrait({ m, size }: { m: DirectoryMember; size: "row" | "pane" }) {
  const box = size === "row" ? "h-11 w-11" : "h-24 w-24";
  return m.avatar ? (
    // A plain <img>: these are small local SVGs, and members' uploaded photos
    // will come from Blob — next/image adds nothing for either at this size.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.avatar} alt="" width={96} height={96} className={cn(box, "shrink-0 border border-border bg-bone object-cover")} />
  ) : (
    <span aria-hidden="true" className={cn(box, MONO.label, "flex shrink-0 items-center justify-center bg-graphite text-bone")}>
      {initials(m.name)}
    </span>
  );
}

export function DirectoryBrowser({
  members,
  initialId,
}: {
  members: DirectoryMember[];
  /** Preselected from `?m=` — the dashboard's "Say hello" links land here. */
  initialId?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [audience, setAudience] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(initialId ?? null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => {
        const hay = [m.name, m.headline, m.role, m.company ?? "", ...m.askMeAbout].join(" ").toLowerCase();
        return (!q || hay.includes(q)) && (audience === "all" || m.audience === audience);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, query, audience]);

  const groups = React.useMemo(() => {
    const by = new Map<string, DirectoryMember[]>();
    for (const m of filtered) {
      const l = letterOf(m.name);
      by.set(l, [...(by.get(l) ?? []), m]);
    }
    return [...by.entries()].sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
  }, [filtered]);

  // The pane shows the selection while it's still in the filtered list,
  // otherwise the first person as rendered.
  const selected = filtered.find((m) => m.id === selectedId) ?? groups[0]?.[1][0] ?? null;
  const narrowed = Boolean(query.trim()) || audience !== "all";
  const letters = new Set(groups.map(([l]) => l));

  function choose(m: DirectoryMember) {
    setSelectedId(m.id);
    // The pane is desktop-only; below lg the profile opens in the slide-out.
    if (window.matchMedia("(max-width: 1023px)").matches) setDrawerOpen(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.7} />
          <label htmlFor="dir-search" className="sr-only">Search the directory</label>
          <Input
            id="dir-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, companies, skills"
            className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-graphite">
              <X className="h-4 w-4" strokeWidth={1.7} />
            </button>
          )}
        </div>
        <Combobox
          name="audience"
          className="sm:w-60"
          options={[{ value: "all", label: "Everyone" }, ...AUDIENCES.map((a) => ({ value: a, label: a }))]}
          value={audience}
          onChange={setAudience}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(MONO.label, "text-muted-foreground")}>
          {narrowed ? `${filtered.length} of ${members.length} members` : `${members.length} members`}
          {narrowed && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setAudience("all");
              }}
              className={cn("ml-3 normal-case tracking-normal", LINK)}
            >
              Clear
            </button>
          )}
        </p>
        {/* A–Z jump bar — letters with nobody under them are inert. */}
        <nav aria-label="Jump to letter" className="hidden flex-wrap gap-0.5 md:flex">
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) =>
            letters.has(l) ? (
              <a key={l} href={`#dir-${l}`} className={cn(MONO.micro, "px-1 py-0.5 text-graphite hover:text-clay")}>
                {l}
              </a>
            ) : (
              <span key={l} aria-hidden="true" className={cn(MONO.micro, "px-1 py-0.5 text-border")}>
                {l}
              </span>
            ),
          )}
        </nav>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-dashed border-border bg-bone-light px-6 py-12 text-sm text-muted-foreground">
          No one matches. Try a different word — or ask in the member Slack.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          {/* Master: the list. overflow-clip, not hidden — hidden would make
              it a scroll container and the letter headings would stop sticking. */}
          <div className="overflow-clip border border-border bg-bone-light">
            {groups.map(([letter, people]) => (
              <section key={letter} id={`dir-${letter}`} className="scroll-mt-20">
                {/* top-16 clears the portal's 64px top bar. */}
                <h2 className={cn(MONO.label, "sticky top-16 z-10 border-b border-border bg-bone px-4 py-1.5 text-muted-foreground")}>
                  {letter}
                </h2>
                <ul>
                  {people.map((m) => {
                    const active = selected?.id === m.id;
                    return (
                      <li key={m.id} className="border-b border-border last:border-b-0">
                        <button
                          type="button"
                          onClick={() => choose(m)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "flex w-full items-center gap-3.5 border-l-2 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-inset",
                            active ? "border-clay bg-bone" : "border-transparent hover:bg-bone",
                          )}
                        >
                          <Portrait m={m} size="row" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-graphite">{m.name}</span>
                            <span className="block truncate text-sm text-muted-foreground">
                              {m.role}
                              {m.company ? ` · ${m.company}` : ""}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          {/* Detail: the persistent pane (desktop). */}
          <div className="hidden lg:sticky lg:top-20 lg:block">
            {selected && (
              <div className="max-h-[calc(100vh-6.5rem)] overflow-y-auto border border-border bg-bone-light p-8">
                <MemberDetail m={selected} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail: the slide-out (phones and tablets). */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} eyebrow={selected?.audience} title={selected?.name ?? "Member"}>
        {selected && <MemberDetail m={selected} inDrawer />}
      </Drawer>
    </div>
  );
}

function MemberDetail({ m, inDrawer = false }: { m: DirectoryMember; inDrawer?: boolean }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-5">
        <Portrait m={m} size="pane" />
        <div className="min-w-0">
          {!inDrawer && <p className={cn(MONO.label, "text-muted-foreground")}>{m.audience}</p>}
          {!inDrawer && <p className={cn(HEADING.subhead, "mt-1 text-graphite")}>{m.name}</p>}
          <p className="mt-1 text-graphite">
            {m.role}
            {m.company ? ` · ${m.company}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">Member since {since(m.memberSince)}</p>
        </div>
      </div>
      <p className="text-xl leading-snug text-graphite">{m.headline}</p>
      <FieldGroup title="Ask me about">
        <div className="flex flex-wrap gap-1.5">
          {m.askMeAbout.map((t) => (
            <span key={t} className="border border-border bg-bone px-2.5 py-1 text-sm text-graphite">{t}</span>
          ))}
        </div>
      </FieldGroup>
      {m.lookingFor && (
        <FieldGroup title="Looking for">
          <p className="leading-relaxed text-graphite">{m.lookingFor}</p>
        </FieldGroup>
      )}
      <FieldGroup title="About">
        <p className="leading-relaxed text-muted-foreground">{m.bio}</p>
      </FieldGroup>
      {/*
        PROFILE LINKS as a row of icons. LinkedIn's official [in] logo in
        black — one of its three allowed colors, unaltered, as a link to the
        member's own profile, which LinkedIn's brand rules permit
        (public/brand/third-party/README.md). Website uses a generic globe.
      */}
      {(m.website || m.linkedin) && (
        <div className="flex flex-wrap items-center gap-2">
          {m.linkedin && (
            <a
              href={m.linkedin}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${m.name} on LinkedIn (opens in a new tab)`}
              title="LinkedIn"
              className="inline-flex h-10 w-10 items-center justify-center border border-border bg-bone transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/third-party/linkedin-in-black.png" alt="" width={21} height={20} className="h-5 w-auto" />
            </a>
          )}
          {m.website && (
            <a
              href={m.website}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${m.name}'s website (opens in a new tab)`}
              title="Website"
              className="inline-flex h-10 w-10 items-center justify-center border border-border bg-bone text-graphite transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
            >
              <Globe className="h-5 w-5" strokeWidth={1.6} />
            </a>
          )}
        </div>
      )}
      <p className="text-sm leading-relaxed text-muted-foreground">
        Want an introduction? Say hello on the floor, or message them in the member Slack.
      </p>
    </div>
  );
}
