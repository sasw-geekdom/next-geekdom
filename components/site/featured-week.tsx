import { ArrowUpRight } from "lucide-react";
import { ARROW, Eyebrow, HEADING, MONO } from "@/components/site/section";
import { ButtonAnchor } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { SASW, SASW_FEATURED, type FeaturedEvent } from "@/lib/sasw";
import { ECOSYSTEM } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * A PINNED FEATURE BESIDE A SCROLLING BILL.
 *
 * NOT ITS OWN SECTION — it renders INSIDE the page header's band, under the
 * h1, and that is the fix for a seam rather than a decoration of one. As two
 * bands it went Bone to Bone Light across a tone step of six points with no
 * hairline, which is the adjacency AGENTS.md says will not read; and the
 * featured slot was the LIGHTER of the two, so the thing being featured
 * receded from the thing introducing it. One band, one ground, no join.
 *
 * THE h1 CANNOT LIVE IN HERE, which is why this takes no heading. This
 * component only renders while the week is on; the page needs its heading
 * every day of the year.
 *
 * The one thing on the calendar big enough to be its own destination sits in a
 * rail on the left and stays there; the sessions inside it scroll past on the
 * right. The shape is the argument: the week is a container, and a reader who
 * scrolls six sessions deep should still be able to see what they are part of
 * and how to get a ticket without scrolling back.
 *
 * `lg:self-start` IS LOAD-BEARING, not tidiness. A grid item stretches to its
 * row by default, so the rail would be exactly as tall as the list beside it
 * and `top` would have nothing to pin against — `position: sticky` silently
 * does nothing. `top-24` clears the `h-16` navbar with room to spare, which is
 * the same offset /club and the homepage already use.
 *
 * THE RAIL HAS TO STAY SHORTER THAN THE VIEWPORT or it cannot pin usefully:
 * a sticky element taller than the screen scrolls until its bottom lands, and
 * on a laptop that reads as a column that mostly does not stick. Measured at
 * 346px against a ~900px laptop viewport, which is why the panel holds a
 * name, a date, a sentence and one button and nothing more.
 *
 * ── IT IS BUILT FOR LUMA, AND FED BY HAND FOR NOW ─────────────────────────
 *
 * Nothing below knows what SASW is. It takes `FeaturedEvent[]`, which is the
 * shape `LumaEvent` maps onto almost field for field — see lib/sasw.ts, which
 * is the stopgap array and is meant to be deleted. Keep this component taking
 * a list and a feature; do not reach into `SASW_FEATURED` from inside it.
 *
 * THE ROWS LINK OUT, so they take `ARROW.external` and the `↗` that goes with
 * it. They are sessions on somebody else's site — sasw.co, which Geekdom also
 * runs, but a different site — and `/events/[slug]` is a Luma-backed route
 * that has no page for any of them.
 */
export function FeaturedWeek() {
  /*
    THE COPY COMES FROM `ECOSYSTEM`, NOT FROM lib/sasw.ts.

    The homepage already describes this week — its name, the verb for
    Geekdom's relationship to it, its five circuits and its dates are all
    transcribed there. Restating any of that here is how the two drift, which
    is the exact failure `ECOSYSTEM` was built to end. lib/sasw.ts holds only
    what that entry cannot: real `Date`s, because the cutoff has to compare
    them, and the sessions themselves.
  */
  const entry = ECOSYSTEM.find((e) => e.href.startsWith(SASW.href));

  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Eyebrow>Featured</Eyebrow>
        <h2 className={cn("mt-4 text-graphite", HEADING.subhead)}>
          {entry?.name ?? SASW.name}
        </h2>
        {entry?.detail && (
          <p className={cn("mt-3", MONO.label, "text-muted-foreground")}>
            {entry.detail}
          </p>
        )}
        {entry && (
          <p className="mt-5 leading-relaxed text-muted-foreground">
            {entry.description}
          </p>
        )}
        {/*
          The verb, kept. ECOSYSTEM's whole point is that "Run by Geekdom"
          and "Operated by Geekdom for the City" are different claims, and
          a feature panel that dropped the role would be the flattening
          that file exists to prevent.
        */}
        {entry?.role && (
          <p className={cn("mt-5", MONO.label, "text-concrete")}>
            {entry.role}
          </p>
        )}
        <ButtonAnchor
          external
          href={entry?.href ?? SASW.href}
          variant="ink"
          className="mt-7"
        >
          See the full week
        </ButtonAnchor>
      </aside>

      {/*
        `min-w-0` because a grid item's default `min-width: auto` refuses
        to shrink below its content, and one long session title would push
        the track wider than its share and squeeze the rail.
      */}
      <div className="min-w-0">
        <h3 className={cn(MONO.label, "text-muted-foreground")}>
          On the bill
        </h3>
        <ol className="mt-4">
          {SASW_FEATURED.map((event) => (
            <FeaturedRow key={event.id} event={event} />
          ))}
        </ol>
      </div>
    </div>
  );
}

/**
 * One session.
 *
 * The hairline row, which is this site's idiom for a scannable list — the
 * Studio's terms and criteria, the portfolio wall, the film. A card grid here
 * would fight the rail beside it for attention and halve the number of
 * sessions visible at once.
 */
function FeaturedRow({ event }: { event: FeaturedEvent }) {
  const where = event.venueDetail
    ? `${event.venue} · ${event.venueDetail}`
    : event.venue;

  return (
    <li className="group border-t border-border transition-colors hover:border-clay">
      <a
        href={event.href}
        target="_blank"
        rel="noreferrer noopener"
        className="-mx-3 block px-3 py-5 transition-colors hover:bg-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        <p className={cn(MONO.label, "text-muted-foreground")}>
          {formatDateTime(event.start)}
          {event.circuit && ` · ${event.circuit}`}
        </p>
        <h4
          className={cn(
            "mt-2 flex items-center gap-1.5 text-graphite",
            HEADING.item,
          )}
        >
          <span className="decoration-clay decoration-2 underline-offset-4 group-hover:underline">
            {event.title}
          </span>
          <ArrowUpRight aria-hidden="true" className={ARROW.external} />
        </h4>
        <p className="mt-1.5 text-sm text-muted-foreground">{where}</p>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
          {event.blurb}
        </p>
      </a>
    </li>
  );
}
