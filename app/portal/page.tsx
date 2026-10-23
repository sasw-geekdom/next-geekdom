import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { requireMember } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { getMemberByEmail } from "@/lib/admin/queries";
import { getUpcomingEvents } from "@/lib/content/events";
import { eventTimeLabel } from "@/lib/content/dates";
import { LUMA_CALENDAR_URL, SOCIALS } from "@/lib/site";
import { MOCK_DIRECTORY, MOCK_FIELD_NOTE, MOCK_SLACK } from "@/data/mock/portal";
import { ARROW, HEADING, LINK_ARROW, LINK_ARROW_ON_INK, MONO } from "@/components/site/section";
import { MemberBadge } from "@/components/ui/badge";
import { Tile } from "@/components/portal/tile";
import { PortalPage } from "@/components/portal/portal-page";
import { SlackMark } from "@/components/portal/slack-mark";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

function longDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/*
  THE MEMBER DASHBOARD — a bento, after next-angels' dashboard: tiles of
  different sizes that each answer one question, rather than one long page.

    ┌──────────────────────────┬──────────────┐
    │ Your membership          │ Member Slack │  compact CTA (Graphite)
    ├──────────────────────────┼──────────────┤
    │ This month in the Club   │ Follow (row) │  events: the largest tile —
    │                          ├──────────────┤  what changes most
    │                          │ Field Notes  │
    ├──────────────────────────┴──────────────┤
    │ New in the Club — four newest, full     │  the people tile
    ├─────────────────────────────────────────┤
    │ Need something?  (a slim row)           │
    └─────────────────────────────────────────┘

  REAL where it can be: the membership is the member's record; the events
  are the same list the homepage renders. Slack and Field Notes don't exist
  yet, so those tiles are SAMPLE content (data/mock/portal.ts) and say so.

  `requireMember()` again, not only in the layout: a layout doesn't re-run on
  client navigation, so each page checks its own session (Next 16 auth guide).
*/
export default async function PortalHome() {
  const user = await requireMember();
  const [member, events] = await Promise.all([
    getMemberByEmail(user.email),
    getUpcomingEvents(),
  ]);
  const staff = isAdmin(user);
  const first = (member?.name ?? user.name ?? "").split(" ")[0];
  // The four newest SAMPLE members (the hand-written ten), with portraits.
  const newest = [...MOCK_DIRECTORY]
    .sort((a, b) => b.memberSince.localeCompare(a.memberSince))
    .slice(0, 4)
    .map((m) => ({ ...m, avatar: m.avatar ?? `/mock/avatars/${m.id}.svg` }));

  return (
    <PortalPage
      eyebrow="Member portal"
      title={first ? `Welcome back, ${first}.` : "Welcome back."}
      notice={
        <>
          Slack, Field Notes and New in the Club are samples — none exists yet.
        Your membership and this month&rsquo;s events are real.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── Your membership ─────────────────────────────────────────── */}
        {/*
          A MEMBER sees their membership. GEEKDOM STAFF see a team card —
          they're part of the room, not visitors to it, so the tile names
          them as the team rather than explaining what their account lacks
          (staff are recognized by email domain and have no member record:
          no join date, renewal or billing to show).
        */}
        <Tile label={member || !staff ? "Your membership" : "Geekdom team"} className="lg:col-span-2">
          {member ? (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={cn(HEADING.subhead, "text-graphite")}>{member.name}</p>
                <p className="mt-2 text-muted-foreground">
                  Member since {longDate(member.joinedAt)}
                  {member.currentPeriodEnd &&
                    ` · ${member.cancelAtPeriodEnd ? "Ends" : "Renews"} ${longDate(member.currentPeriodEnd)}`}
                </p>
                <div className="mt-3">
                  <MemberBadge status={member.status} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <Link href="/portal/profile" className={LINK_ARROW}>
                  Edit your profile
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </Link>
                <Link href="/portal/profile#billing" className={LINK_ARROW}>
                  Billing
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={cn(HEADING.subhead, "text-graphite")}>{user.name ?? user.email}</p>
                <p className="mt-2 text-muted-foreground">
                  {user.email}
                  {user.role === "superadmin" && " · Superadmin"}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <Link href="/portal/profile" className={LINK_ARROW}>
                  Edit your profile
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </Link>
                <Link href="/portal/admin" className={LINK_ARROW}>
                  Open the admin
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </Link>
              </div>
            </div>
          )}
        </Tile>

        {/* ── Member Slack (sample) — a compact call to action ────────── */}
        {/*
          It was the tallest tile on the page for a CTA that reads "opening
          soon". Now: the mark, one line, the button. One-color mark on
          Graphite, per Slack's guidelines (components/portal/slack-mark.tsx).
        */}
        <Tile label="Member Slack" ink>
          <div className="flex items-start gap-4">
            <SlackMark className="h-8 w-8 shrink-0 text-bone" />
            <p className="leading-relaxed text-bone/80">
              Ask for an intro, offer what you know, see who&rsquo;s on the floor today.
            </p>
          </div>
          <div className="mt-auto pt-6">
            {MOCK_SLACK.inviteUrl ? (
              <a href={MOCK_SLACK.inviteUrl} target="_blank" rel="noreferrer noopener" className={LINK_ARROW_ON_INK}>
                Open Slack
                <ArrowUpRight aria-hidden="true" className={ARROW.external} />
              </a>
            ) : (
              <p className="text-sm text-bone/60">Opening soon — the invite will be here.</p>
            )}
          </div>
        </Tile>

        {/* ── This month in the Club (real) ───────────────────────────── */}
        <Tile
          label="This month in the Club"
          className="lg:col-span-2"
          action={
            <a href={LUMA_CALENDAR_URL} target="_blank" rel="noreferrer noopener" className={cn("text-sm", LINK_ARROW)}>
              Calendar
              <ArrowUpRight aria-hidden="true" className={ARROW.external} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          }
        >
          {events.length === 0 ? (
            <p className="text-muted-foreground">Nothing listed yet this month.</p>
          ) : (
            <ul className="border-b border-border">
              {events.slice(0, 4).map((ev) => (
                <li key={ev.id} className="border-t border-border">
                  <a
                    href={ev.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light sm:grid-cols-[9rem_1fr_auto] sm:gap-x-6"
                  >
                    <span className={cn(MONO.label, "col-span-2 pt-1 text-muted-foreground sm:col-span-1")}>
                      {ev.dateLabel} · {eventTimeLabel(ev.startsAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="leading-snug text-graphite decoration-clay decoration-2 underline-offset-4 group-hover:underline">
                        {ev.title}
                      </span>
                      {ev.host && (
                        <span className="mt-0.5 block text-sm text-muted-foreground">Hosted by {ev.host}</span>
                      )}
                    </span>
                    <ArrowUpRight aria-hidden="true" className={cn(ARROW.external, "self-center text-muted-foreground")} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/*
          THE RIGHT COLUMN beside the events: Follow Geekdom (compact) over
          Field Notes, which takes the remaining height — together they match
          the events tile instead of one stretched, mostly empty box.
        */}
        <div className="flex flex-col gap-4">
        {/* ── Follow Geekdom ───────────────────────────────────────────── */}
        {/*
          Geekdom's channels, from SOCIALS (the footer's list) as arrow links —
          the site's pattern for everything that isn't Apply. Compact, in a row: it
          was a full-height tile that left most of itself empty. A "latest
          video" from YouTube can grow it once the channel feed is connected.
        */}
        <Tile label="Follow Geekdom" className="flex-none">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noreferrer noopener" className={LINK_ARROW}>
                  {s.label}
                  <ArrowUpRight aria-hidden="true" className={ARROW.external} />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </Tile>
        {/* ── Field Notes (sample) ────────────────────────────────────── */}
        <Tile label="Field Notes" className="flex-1">
          <p className={cn(MONO.label, "text-muted-foreground")}>
            {longDate(MOCK_FIELD_NOTE.date)} · {MOCK_FIELD_NOTE.readMinutes} min
          </p>
          <p className={cn("mt-3 text-graphite", HEADING.item)}>{MOCK_FIELD_NOTE.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{MOCK_FIELD_NOTE.excerpt}</p>
          <div className="mt-auto pt-5">
            <span className={cn(LINK_ARROW, "cursor-default text-sm opacity-60")} aria-disabled="true">
              Read the note
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </span>
          </div>
        </Tile>
        </div>

        {/* ── New in the Club (sample) — the people tile ─────────────── */}
        {/*
          THE DASHBOARD'S BIGGEST GAP WAS PEOPLE. Everything else here is
          Geekdom talking to the member; this is the one tile about other
          members — the Club's whole promise is a thinking partner, a person.
          The three newest listed members, each a link to their profile in the
          directory. Sample members until the real directory (Phase 3).
        */}
        <Tile
          label="New in the Club"
          className="lg:col-span-3"
          action={
            <Link href="/portal/directory" className={cn("text-sm", LINK_ARROW)}>
              Directory
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
          }
        >
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {newest.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/portal/directory?m=${m.id}`}
                  className="group flex h-full flex-col border border-border bg-bone p-4 transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light"
                >
                  <span className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.avatar} alt="" width={44} height={44} className="h-11 w-11 shrink-0 border border-border bg-bone object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-graphite">{m.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{m.role}</span>
                    </span>
                  </span>
                  <span className="mt-3 block text-sm leading-relaxed text-graphite">{m.headline}</span>
                  <span className={cn(LINK_ARROW, "mt-auto pt-4 text-sm")}>
                    Say hello
                    <ArrowRight aria-hidden="true" className={ARROW.internal} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Tile>

        {/* ── Need something? — a slim row ──────────────────────────── */}
        <section className="flex flex-col gap-3 border border-border bg-bone-light px-6 py-5 sm:flex-row sm:items-center sm:gap-8 sm:px-7 lg:col-span-3">
          <h2 className={cn(MONO.label, "text-muted-foreground")}>Need something?</h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <Link href="/portal/resources" className={LINK_ARROW}>
              FAQ and resources
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
            <Link href="/portal/directory" className={LINK_ARROW}>
              Find a member
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
            <a href="mailto:club@geekdom.com" className={LINK_ARROW}>
              club@geekdom.com
              <ArrowUpRight aria-hidden="true" className={ARROW.external} />
            </a>
          </div>
        </section>
      </div>
    </PortalPage>
  );
}
