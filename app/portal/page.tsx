import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { requireMember } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { getMemberByEmail } from "@/lib/admin/queries";
import { getUpcomingEvents } from "@/lib/content/events";
import { getGalleryImages } from "@/lib/gallery";
import { eventTimeLabel } from "@/lib/content/dates";
import { FOUNDED_YEAR, LUMA_CALENDAR_URL, SOCIALS } from "@/lib/site";
import { indexOrder, listForReaders } from "@/lib/field-notes/notes";
import { bookerFor, upcomingFor, weekUsage } from "@/lib/rooms/rooms";
import { BOOKING_WINDOW, ROOM_RULES, centralDay, dayLabel, lengthLabel, timeLabel, weekKey } from "@/lib/rooms/rules";
import { planOf } from "@/lib/membership";
import { listDirectory } from "@/lib/directory";
import { stepsFor } from "@/lib/onboarding";
import { OnboardingPanel, type OnboardingStepView } from "@/components/portal/onboarding-panel";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMemberResources } from "@/lib/content/member-resources";
import { ARROW, HEADING, LINK_ARROW, LINK_ARROW_ON_INK, MONO } from "@/components/site/section";
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
  THE MEMBER DASHBOARD — a bento: tiles of different sizes that each answer
  one question, ordered by what changes most.

    Welcome back, Ana.
    Solo membership · since Nov 6, 2026 · Profile & billing →   (one line)
    [Get started — first visits only]
    ┌──────────────────────────────┬──────────────┐
    │ This month in the Club       │ Book a room  │  what's on · your rooms
    ├──────────────────────────────┴──────────────┤
    │ New in the Club — four newest               │  the people tile
    ├──────────────────────────────┬──────────────┤
    │ Field Notes — the latest     │ Member Slack │
    │                              │ Follow       │
    ├──────────────────────────────┴──────────────┤
    │ Since 2011 · Need something?                │
    └─────────────────────────────────────────────┘

  The membership was a two-column tile for three facts that live on
  Profile; it's one line under the welcome now (past due gets its own
  notice). Book a room sits beside the events — the other thing that
  changes week to week. Field Notes is the REAL latest note (it was a
  hard-coded sample with a dead link, which is why the page carried a
  "Sample content" banner). Everything here is real.

  `requireMember()` again, not only in the layout: a layout doesn't re-run on
  client navigation, so each page checks its own session (Next 16 auth guide).
*/
export default async function PortalHome() {
  const user = await requireMember();
  // Server time, once.
  const now = new Date().getTime();
  const [member, events, wall, resources, directory, notes, booker] = await Promise.all([
    getMemberByEmail(user.email),
    getUpcomingEvents(),
    getGalleryImages(), // never throws; [] until the wall is synced
    getMemberResources(), // never throws; the Slack invite is staff-edited
    listDirectory().catch(() => []),
    listForReaders().catch(() => []),
    bookerFor(user).catch(() => null),
  ]);
  const thisWeek = weekKey(new Date(now).toISOString());
  const [myRooms, usage] = booker
    ? await Promise.all([upcomingFor(booker.id, now).catch(() => []), weekUsage(booker.id, [thisWeek]).catch(() => ({}) as Record<string, number>)])
    : [[], {} as Record<string, number>];
  const hoursLeft = Math.max(0, ROOM_RULES.weeklyMinutes - (usage[thisWeek] ?? 0));
  // The note /field-notes leads with: the featured one, else the newest.
  const note = indexOrder(notes)[0];
  const cover = note?.frames[0]?.type === "cover" ? note.frames[0].image : undefined;
  const archive = wall.slice(0, 5);
  const staff = isAdmin(user);
  const first = (member?.name ?? user.name ?? "").split(" ")[0];

  /*
    FIRST VISIT: "Welcome", not "Welcome back" — and the visit is recorded
    so the next one says back. Members only; staff have no member record.
  */
  const firstVisit = Boolean(member && !member.onboarding.firstSeenAt);
  if (member && firstVisit) {
    await getAdminDb()
      .collection(COLLECTIONS.members)
      .doc(member.id)
      .set({ onboarding: { firstSeenAt: new Date() } }, { merge: true })
      .catch(() => {});
  }
  // The "Get started" checklist (lib/onboarding.ts) — Slack only once there's an invite.
  const onboardingSteps: OnboardingStepView[] = member
    ? stepsFor(Boolean(resources.slackInviteUrl)).map((id) => {
        if (id === "profile") return { id, href: "/portal/profile" };
        if (id === "directory") return { id, href: `/portal/directory?m=${member.id}` };
        if (id === "events") return { id, href: LUMA_CALENDAR_URL, external: true };
        if (id === "slack") return { id, href: resources.slackInviteUrl, external: true };
        return { id, href: "/portal/resources" };
      })
    : [];
  // The four newest LISTED members — the people tile (lib/directory.ts).
  const newest = [...directory].sort((a, b) => b.memberSince.localeCompare(a.memberSince)).slice(0, 4);

  const plan = planOf(member?.plan);

  return (
    <PortalPage eyebrow="Member portal" title={first ? `Welcome${firstVisit ? "" : " back"}, ${first}.` : "Welcome."}>
      {/* The membership, in one line — the details are on Profile. */}
      <p className="-mt-4 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        {member ? (
          <>
            <span>
              {plan.name} membership · since {longDate(member.joinedAt)}
              {member.status === "inactive" ? " · paused" : member.status === "canceled" ? " · canceled" : ""}
            </span>
            <Link href="/portal/profile" className={cn("text-sm", LINK_ARROW)}>
              Profile and billing
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
          </>
        ) : staff ? (
          <>
            <span>
              Geekdom team{user.role === "superadmin" ? " · Owner" : ""} — you see the portal as members do.
            </span>
            <Link href="/portal/admin" className={cn("text-sm", LINK_ARROW)}>
              Open the admin
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
          </>
        ) : null}
      </p>
      {member?.status === "past_due" && (
        <p role="status" className="mb-6 border border-dashed border-graphite px-4 py-3 text-sm text-graphite">
          Your last payment didn&rsquo;t go through, so your card needs updating. You still have full access.{" "}
          <Link href="/portal/profile#billing" className="underline decoration-clay decoration-1 underline-offset-2">
            Update it in billing
          </Link>
          .
        </p>
      )}

      {member && (
        <OnboardingPanel steps={onboardingSteps} done={member.onboarding.done} dismissed={member.onboarding.dismissed} />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ── This month in the Club ──────────────────────────────────── */}
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
            <p className="text-muted-foreground">Nothing listed yet this month. The calendar has everything on the floor.</p>
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
                      <span className="leading-snug text-graphite decoration-clay decoration-2 underline-offset-4 group-hover:underline">{ev.title}</span>
                      {ev.host && <span className="mt-0.5 block text-sm text-muted-foreground">Hosted by {ev.host}</span>}
                    </span>
                    <ArrowUpRight aria-hidden="true" className={cn(ARROW.external, "self-center text-muted-foreground")} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Tile>

        {/* ── Book a room — your next bookings, or the way in ─────────── */}
        <Tile label="Book a room">
          {!booker ? (
            <p className="text-sm text-muted-foreground">Conference rooms are for current members.</p>
          ) : myRooms.length === 0 ? (
            <>
              <p className="text-graphite">No room booked.</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Four conference rooms for up to 20, {BOOKING_WINDOW.daysLabel}, {BOOKING_WINDOW.label}. Instant — no approval.
              </p>
            </>
          ) : (
            <ul>
              {myRooms.slice(0, 3).map((b) => (
                <li key={b.id} className="border-t border-border py-2.5 first:border-t-0 first:pt-0">
                  <span className="block font-medium text-graphite">{b.roomName}</span>
                  <span className="block text-sm tabular-nums text-muted-foreground">
                    {dayLabel(centralDay(b.start))} · {timeLabel(b.start)} – {timeLabel(b.end)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {booker && (
            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              <Link href="/portal/rooms" className={LINK_ARROW}>
                {myRooms.length ? "Book another" : "Book a room"}
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
              <span className="text-sm tabular-nums text-muted-foreground">{hoursLeft ? lengthLabel(hoursLeft) : "No time"} left this week</span>
            </div>
          )}
        </Tile>

        {/* ── New in the Club — the people tile ────────────────────────── */}
        {/*
          Everything else here is Geekdom talking to the member; this is the
          one tile about other members — the Club's whole promise is a
          thinking partner, a person. The four newest listed members.
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
          {newest.length === 0 && <p className="text-sm text-muted-foreground">No one is listed in the directory yet.</p>}
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {newest.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/portal/directory?m=${m.id}`}
                  className="group flex h-full flex-col border border-border bg-bone p-4 transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light"
                >
                  <span className="flex items-center gap-3">
                    {m.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatar} alt="" width={44} height={44} className="h-11 w-11 shrink-0 border border-border bg-bone object-cover" />
                    ) : (
                      <span aria-hidden="true" className={cn(MONO.label, "flex h-11 w-11 shrink-0 items-center justify-center bg-graphite text-bone")}>
                        {m.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-graphite">{m.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{[m.role, m.company].filter(Boolean).join(" · ")}</span>
                    </span>
                  </span>
                  {/* Three lines at most, so the four cards stay one height. */}
                  <span className="mt-3 line-clamp-3 block text-sm leading-relaxed text-graphite">{m.headline}</span>
                  <span className={cn(LINK_ARROW, "mt-auto pt-4 text-sm")}>
                    Say hello
                    <ArrowRight aria-hidden="true" className={ARROW.internal} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Tile>

        {/* ── Field Notes — the real latest note ──────────────────────── */}
        <Tile
          label="Field Notes"
          className="lg:col-span-2"
          action={
            <Link href="/field-notes" className={cn("text-sm", LINK_ARROW)}>
              All notes
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
          }
        >
          {!note ? (
            <p className="text-sm text-muted-foreground">Stories from the room, coming soon.</p>
          ) : (
            <Link
              href={`/field-notes/${note.slug}`}
              className="group grid gap-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
            >
              {cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover.srcSm} alt="" width={cover.width} height={cover.height} loading="lazy" className="aspect-[4/3] w-full border border-border object-cover" />
              )}
              <span className="flex min-w-0 flex-col">
                <span className={cn(MONO.label, "text-muted-foreground")}>
                  {longDate(note.publishedAt)}
                  {note.author ? ` · ${note.author}` : ""}
                </span>
                <span className={cn("mt-2 text-graphite decoration-clay decoration-2 underline-offset-4 group-hover:underline", HEADING.item)}>{note.title}</span>
                {note.dek && <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.dek}</span>}
                <span className={cn(LINK_ARROW, "mt-auto pt-4 text-sm")}>
                  Read the note
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </span>
              </span>
            </Link>
          )}
        </Tile>

        {/* ── Slack over Follow ───────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* One-color mark on Graphite, per Slack's guidelines (components/portal/slack-mark.tsx). */}
          <Tile label="Member Slack" ink className="flex-1">
            <div className="flex items-start gap-4">
              <SlackMark className="h-8 w-8 shrink-0 text-bone" />
              <p className="leading-relaxed text-bone/80">Ask for an intro, offer what you know, see who&rsquo;s on the floor today.</p>
            </div>
            <div className="mt-auto pt-6">
              {resources.slackInviteUrl ? (
                <a href={resources.slackInviteUrl} target="_blank" rel="noreferrer noopener" className={LINK_ARROW_ON_INK}>
                  Open Slack
                  <ArrowUpRight aria-hidden="true" className={ARROW.external} />
                </a>
              ) : (
                <p className="text-sm text-bone/60">Opening soon — the invite will be here.</p>
              )}
            </div>
          </Tile>
          {/* Geekdom's channels, from SOCIALS (the footer's list), as arrow links. */}
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
        </div>

        {/* ── Since 2011 — the archive, for the people in it ──────────── */}
        {/*
          THE MEMBERS' WAY IN to /since-2011 (the public one is the footer's
          old wordmark). The people in these photographs are, largely, the
          Club — so the archive is something the portal can hand them that
          the homepage doesn't. Five frames from the wall, square, in the
          brand grade; the strip IS the link. No photos synced → no tile.
        */}
        {archive.length > 0 && (
          <Tile
            label={`Since ${FOUNDED_YEAR}`}
            className="lg:col-span-3"
            action={
              <Link href="/since-2011" className={cn("text-sm", LINK_ARROW)}>
                See the wall
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            <p className="text-sm leading-relaxed text-graphite">
              {new Date().getFullYear() - FOUNDED_YEAR} years of Geekdom, in photographs.
              You might be in a few.
            </p>
            <Link
              href="/since-2011"
              aria-label="Geekdom since 2011 — the photo wall"
              className="mt-4 grid grid-cols-3 gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light sm:grid-cols-5"
            >
              {archive.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.name}
                  src={img.url}
                  alt=""
                  width={img.width}
                  height={img.height}
                  loading="lazy"
                  style={{ backgroundImage: `url(${img.blurDataURL})`, backgroundSize: "cover" }}
                  className={cn(
                    "aspect-4/3 w-full border border-border object-cover transition-opacity hover:opacity-85",
                    i >= 3 && "hidden sm:block",
                  )}
                />
              ))}
            </Link>
          </Tile>
        )}

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
