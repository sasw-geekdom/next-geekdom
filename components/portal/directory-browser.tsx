"use client";

import * as React from "react";
import { Globe, Search, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requestIntro } from "@/lib/portal/intro-actions";
import { INTRO_NOTE_MAX, INTRO_NOTE_MIN } from "@/lib/intro-rules";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { HEADING, LINK, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { AUDIENCES } from "@/lib/membership";
import type { DirectoryMember } from "@/lib/directory";

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

/** The row's second line: role · company, else the headline. */
function subline(m: DirectoryMember): string {
  const work = [m.role, m.company].filter(Boolean).join(" · ");
  return work || m.headline || "";
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Portrait({ m, size }: { m: DirectoryMember; size: "row" | "pane" }) {
  const box = size === "row" ? "h-10 w-10" : "h-20 w-20";
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
  meId = null,
  popular = [],
  openIntro = false,
}: {
  /** `?intro=1` (the welcome flow's "Ask for an intro"): open the form for the preselected member. */
  openIntro?: boolean;
  members: DirectoryMember[];
  /** Preselected from `?m=` — the dashboard's "Say hello" links land here. */
  initialId?: string;
  /** The viewer's own member id — no intro to yourself. Null: staff without a membership (can't send). */
  meId?: string | null;
  /** "Ask me about" topics in use, most common first (lib/directory.ts topicsInUse). */
  popular?: { topic: string; count: number }[];
}) {
  const [query, setQuery] = React.useState("");
  // A topic picked from a profile or the popular row — an exact match, not a search.
  const [topic, setTopic] = React.useState<string | null>(null);
  const [audience, setAudience] = React.useState("all");
  const hasAudience = members.some((m) => m.audience);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialId ?? null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => {
        const hay = [m.name, m.headline, m.role, m.company ?? "", ...m.askMeAbout].join(" ").toLowerCase();
        const onTopic = !topic || m.askMeAbout.some((t) => t.toLowerCase() === topic.toLowerCase());
        return (!q || hay.includes(q)) && (audience === "all" || m.audience === audience) && onTopic;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, query, audience, topic]);

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
  const narrowed = Boolean(query.trim()) || audience !== "all" || Boolean(topic);
  // Shared by two or more members — a single person's topic isn't "popular".
  const popularRow = popular.filter((t) => t.count >= 2).slice(0, 12);
  function pickTopic(t: string) {
    setTopic(t);
    setQuery("");
    setDrawerOpen(false);
    document.getElementById("dir-search")?.scrollIntoView({ block: "nearest" });
  }
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
        {/* Only once someone has said what describes them — imported profiles
            have no audience, so every choice but Everyone found no one. */}
        {hasAudience && (
          <Combobox
            name="audience"
            className="sm:w-60"
            options={[{ value: "all", label: "Everyone" }, ...AUDIENCES.filter((a) => members.some((m) => m.audience === a)).map((a) => ({ value: a, label: a }))]}
            value={audience}
            onChange={setAudience}
          />
        )}
      </div>

      {/*
        TOPICS: what members said they can be asked about, most common
        first. One tap shows everyone with that topic; the chosen one reads
        as a filter with its own ×.
      */}
      {(popularRow.length > 0 || topic) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-muted-foreground">{topic ? "Topic:" : "Ask about:"}</span>
          {topic ? (
            <button
              type="button"
              onClick={() => setTopic(null)}
              aria-label={`Clear topic ${topic}`}
              className="inline-flex items-center gap-1.5 border border-graphite bg-graphite px-2.5 py-1 text-sm text-bone"
            >
              {topic}
              <X className="h-3.5 w-3.5" strokeWidth={1.8} />
            </button>
          ) : (
            popularRow.map((t) => (
              <button
                key={t.topic}
                type="button"
                onClick={() => pickTopic(t.topic)}
                className="border border-border bg-bone-light px-2.5 py-1 text-sm text-graphite transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              >
                {t.topic} <span className="tabular-nums text-muted-foreground">{t.count}</span>
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(MONO.label, "text-muted-foreground")}>
          {narrowed ? `${filtered.length} of ${members.length} members` : `${members.length} members`}
          {narrowed && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setAudience("all");
                setTopic(null);
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
                            "flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-inset",
                            active ? "border-clay bg-bone" : "border-transparent hover:bg-bone",
                          )}
                        >
                          <Portrait m={m} size="row" />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-graphite">{m.name}</span>
                            {/* Role and company, or — as most imported profiles have
                                neither — the headline, so the list says who to talk to. */}
                            {(subline(m)) && <span className="block truncate text-sm text-muted-foreground">{subline(m)}</span>}
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
                <MemberDetail m={selected} meId={meId} onTopic={pickTopic} startIntro={openIntro && selected.id === initialId} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail: the slide-out (phones and tablets). */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} eyebrow={selected?.audience} title={selected?.name ?? "Member"}>
        {selected && <MemberDetail m={selected} meId={meId} onTopic={pickTopic} startIntro={openIntro && selected.id === initialId} inDrawer />}
      </Drawer>
    </div>
  );
}

function MemberDetail({
  m,
  meId,
  onTopic,
  startIntro = false,
  inDrawer = false,
}: {
  m: DirectoryMember;
  meId: string | null;
  onTopic: (t: string) => void;
  startIntro?: boolean;
  inDrawer?: boolean;
}) {
  const work = [m.role, m.company].filter(Boolean).join(" · ");
  // Only what the member filled in — an empty "Ask me about" heading read as
  // a broken page. A sparse profile says so once, kindly.
  const sparse = !m.askMeAbout.length && !m.lookingFor && !m.bio;
  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center gap-5">
        <Portrait m={m} size="pane" />
        <div className="min-w-0">
          {!inDrawer && <p className={cn(HEADING.subhead, "text-graphite")}>{m.name}</p>}
          {work && <p className="mt-1 text-graphite">{work}</p>}
          <p className="mt-0.5 text-sm text-muted-foreground">
            {m.audience ? `${m.audience} · ` : ""}Member since {since(m.memberSince)}
          </p>
        </div>
      </div>
      {m.headline && <p className="text-lg leading-snug text-graphite">{m.headline}</p>}
      {m.askMeAbout.length > 0 && (
        <FieldGroup title="Ask me about">
          <div className="flex flex-wrap gap-1.5">
            {/* Each topic shows everyone who can be asked about it. */}
            {m.askMeAbout.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTopic(t)}
                title={`Everyone you can ask about ${t}`}
                className="border border-border bg-bone px-2.5 py-1 text-sm text-graphite transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              >
                {t}
              </button>
            ))}
          </div>
        </FieldGroup>
      )}
      {m.lookingFor && (
        <FieldGroup title="Looking for">
          <p className="leading-relaxed text-graphite">{m.lookingFor}</p>
        </FieldGroup>
      )}
      {m.bio && (
        <FieldGroup title="About">
          <p className="leading-relaxed text-muted-foreground">{m.bio}</p>
        </FieldGroup>
      )}
      {sparse && (
        <p className="text-sm text-muted-foreground">{m.name.split(" ")[0]} hasn&rsquo;t added more to their profile yet.</p>
      )}
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
      {m.id !== meId && <IntroBox key={m.id} m={m} canSend={meId !== null} startOpen={startIntro} />}
    </div>
  );
}

/*
  ASK FOR AN INTRO (lib/portal/intro-actions.ts). Geekdom emails them your
  note with Reply-To set to you, so their reply comes straight to your
  inbox and their address stays private until they answer. Folded to one
  button until asked for; keyed by member, so switching people resets it.
*/
function IntroBox({ m, canSend, startOpen = false }: { m: DirectoryMember; canSend: boolean; startOpen?: boolean }) {
  const first = m.name.split(" ")[0];
  const [open, setOpen] = React.useState(startOpen);
  const [note, setNote] = React.useState("");
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  if (!canSend) {
    return <p className="text-sm text-muted-foreground">Members can ask {first} for an intro from here. (You&rsquo;re previewing as staff.)</p>;
  }
  if (result?.ok) {
    return (
      <p role="status" className="border-l-2 border-clay bg-bone px-4 py-3 text-sm text-graphite">
        {result.message}
      </p>
    );
  }
  if (!open) {
    return (
      <div className="flex flex-col items-start gap-2 border-t border-border pt-5">
        <Button type="button" variant="ink" onClick={() => setOpen(true)}>
          Ask {first} for an intro
        </Button>
        <p className="text-sm text-muted-foreground">We&rsquo;ll email {first} your note. Their reply comes straight to you.</p>
      </div>
    );
  }
  const short = note.trim().length < INTRO_NOTE_MIN;
  return (
    <form
      className="flex flex-col gap-3 border-t border-border pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (short) return setResult({ ok: false, message: "Say a little about why you'd like to meet — a sentence or two." });
        startTransition(async () => setResult(await requestIntro(m.id, note)));
      }}
    >
      <label htmlFor={`intro-${m.id}`} className="text-sm font-medium text-graphite">
        Why would you like to meet {first}?
      </label>
      <Textarea
        id={`intro-${m.id}`}
        value={note}
        maxLength={INTRO_NOTE_MAX}
        onChange={(e) => {
          setNote(e.target.value);
          // An old "too short" shouldn't sit under a note that's now fine.
          if (result && !result.ok) setResult(null);
        }}
        placeholder={`A sentence or two — what you're working on, and what you'd like to ask ${first}.`}
        className="min-h-24"
        autoFocus
      />
      {result && !result.ok && (
        <p role="alert" className="text-sm text-geekdom-red">
          {result.message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" variant="ink" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground underline underline-offset-2">
          Cancel
        </button>
      </div>
      <p className="text-[13px] text-muted-foreground">Your email goes to {first} as the reply address. Theirs stays private until they answer.</p>
    </form>
  );
}
