import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Layout primitives shared by every page.
 *
 * `Section` owns the two things that were otherwise re-decided per page and
 * drifted: the horizontal gutter (which must match the navbar's, or the site
 * visibly steps in and out as you scroll) and the vertical rhythm.
 */

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6 lg:px-8", className)}
      {...props}
    />
  );
}

/**
 * THREE SURFACES, down from four, because the guide only has three.
 *
 * The old set was sand / white / deep / ink — a default, pure white, a DARKER
 * warm band, and the dark ground. Two of those aren't in the brand: the guide's
 * surfaces are Bone (the default, "paper"), Bone Light (the alternate) and
 * Graphite, and pure white appears nowhere in it. Bone Light is also LIGHTER
 * than Bone, so the alternate band now steps up rather than down — `deep` had
 * no equivalent and is gone.
 *
 * Which means pages alternate `bone` / `bone-light` instead of cycling four
 * tones, and two same-tone sections must never end up adjacent: the step
 * between them is six points of luminance and they will read as one long
 * section. Where the rhythm genuinely needs a break and the tone can't change,
 * use a `border-rule` hairline — that is what Rule is for.
 */
export function Section({
  tone = "bone",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  /**
   * `graphite` is the full-bleed dark band. Inside it, small text is bone and
   * accent type is clay — never concrete (3.2:1) and never geekdom red
   * (3.3:1). See globals.css.
   */
  tone?: "bone" | "bone-light" | "graphite" | "graphite-soft";
}) {
  const tones = {
    bone: "bg-bone text-graphite",
    "bone-light": "bg-bone-light text-graphite",
    graphite: "bg-graphite text-bone",
    "graphite-soft": "bg-graphite-soft text-bone",
  };

  return (
    <section
      className={cn("py-20 sm:py-28", tones[tone], className)}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Small monospaced kicker above a heading.
 *
 * CONCRETE ON LIGHT, BONE ON DARK — not Clay, and that is the one place this
 * palette departs from a literal reading of the brand guide.
 *
 * The guide lists "eyebrow labels" among Clay's jobs, and states two pages
 * earlier that Clay on Bone "clears AA for large text only". An eyebrow is
 * 12px. Clay is 3.5:1 on bone and 4.3:1 on graphite, so there is no ground in
 * the palette where it carries text this size legibly. Concrete is 4.7:1 on
 * bone and is the color the guide assigns to "small labels" in the same
 * breath; bone is 15.3:1 on graphite. The guide's own cover page sets its
 * eyebrows in gray, not in Clay.
 *
 * Where an eyebrow wants color, put Clay in a rule beside it — a rule is
 * non-text and only has to clear 3:1, which Clay does on both grounds.
 *
 * `onInk` is the ground switch. It is not optional styling: concrete on
 * graphite is 3.2:1 and fails outright.
 */
export function Eyebrow({
  onInk = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { onInk?: boolean }) {
  return (
    <p
      className={cn(
        MONO.eyebrow,
        onInk ? "text-bone" : "text-concrete",
        className,
      )}
      {...props}
    />
  );
}

/**
 * AN INLINE LINK in running prose.
 *
 * Graphite text with a Clay underline, rather than Clay text. Clay does not
 * reach 4.5:1 on any ground in this palette, so it cannot carry body-size
 * words — but an underline is a rule, the bar for a rule is 3:1, and Clay
 * clears that. The hue stays in the link; the legibility comes from the
 * graphite. `underline-offset-2` keeps the rule off the descenders.
 *
 * This replaces `font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite`, which was written out at fourteen call
 * sites and was the single most common use of Geekdom Red on the site — a
 * color the guide reserves for the logo.
 */
export const LINK =
  "font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite";

/** The same link on a graphite ground. */
export const LINK_ON_INK =
  "font-medium text-bone underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-bone";

/**
 * THE TYPE SCALE.
 *
 * RETUNED FOR RUBIK AT 500. Every tier here used to be `font-bold` (700) on
 * Geist with tracking down to -0.035em. The guide allows two weights, 400 and
 * 500, and says "Never Bold" — and only those two cuts are loaded, so a stray
 * `font-bold` now falls back to 500 rather than synthesising a fake one.
 *
 * Dropping 200 units of weight changes the tracking that works. Rubik is wider
 * than Geist, with a larger x-height and rounder bowls, and a lighter stroke
 * leaves more air inside each counter — so the negative tracking that read as
 * a nudge at 700 closes the counters at 500 and reads as a rendering fault.
 * Every tier loosens by roughly 0.015em, and the leading opens a touch with it
 * because Rubik's taller x-height makes a tight line feel tighter than the
 * number suggests.
 *
 * The rule the ladder encodes is unchanged: as the type gets bigger, the
 * tracking and the leading both tighten.
 *
 *   tier      size ramp                 weight  leading   tracking
 *   display   5xl → 6xl → 7xl           500     1.00      -0.02em
 *   title     4xl → 6xl → 7xl           500     1.04      -0.02em
 *   heading   4xl → 5xl                 500     1.10      -0.015em
 *   subhead   2xl                       500     1.22      -0.01em
 *   item      lg                        500     snug       0
 *
 * Sizes live here rather than at the call site so a heading cannot be nudged
 * one step on one page and left everywhere else.
 */
export const HEADING = {
  /**
   * The claim on a page that has nothing else above the fold.
   *
   * Caps at 7xl (72px), not 8xl. It used to run to 96px on a tall screen and
   * step down to 72px on a laptop, which meant the headline CHANGED SIZE
   * between displays — and on the homepage that moved its last glyph from 773
   * to 972, squeezing the crown beside it from 336px to 220px. The proportion
   * between the two halves of the hero was different on every machine.
   *
   * One size holds that relationship steady everywhere. 72px is still display
   * type; 96px was only ever reachable on a monitor tall enough to fit it.
   */
  display:
    "text-5xl font-medium leading-[1.0] tracking-[-0.02em] sm:text-6xl lg:text-7xl",
  /** A hero with a photograph behind it. */
  title:
    "text-4xl font-medium leading-[1.04] tracking-[-0.02em] sm:text-6xl lg:text-7xl",
  /** h1 on a task or read page, and every SectionTitle. */
  heading:
    "text-4xl font-medium leading-[1.1] tracking-[-0.015em] sm:text-5xl",
  /** The tier under a section title — "What's included", "Recently". */
  subhead: "text-2xl font-medium leading-[1.22] tracking-[-0.01em]",
  /**
   * An item title: one benefit in a list, one card in a grid, one step.
   *
   * Added because this tier was being written six different ways for the same
   * job — `font-semibold` with no size (16px), `text-lg font-semibold` (18px),
   * `text-xl font-bold` (20px) and `text-2xl font-bold` (24px) all appeared as
   * h3s across four files.
   *
   * No negative tracking at this size: 18px is body scale, and the guide's
   * tightening is for display type only.
   */
  item: "text-lg font-medium leading-snug",
} as const;

/**
 * MONO LABELS — the scanned text, as opposed to the read text.
 *
 * Geist Mono is scoped to things you scan rather than read: eyebrows, stat
 * labels, dates, micro-copy. Two tiers, and the difference is deliberate —
 *
 *   eyebrow  text-xs  0.18em   a section kicker, standing alone above a heading
 *   label    text-xs  0.14em   attached to something else — a figure's caption,
 *                              a badge, a table column, a date on a card
 *
 * Wider tracking suits a line with nothing near it; a caption sitting directly
 * under a number wants less, or it reads as detached from the thing it labels.
 * That distinction already existed in practice and was applied by feel — six
 * different mono strings across nine files, with 0.14em and 0.18em used
 * interchangeably for the same job. Named here so the choice is a decision
 * rather than whatever the last person copied.
 */
export const MONO = {
  eyebrow: "font-mono text-xs uppercase tracking-[0.18em]",
  label: "font-mono text-xs uppercase tracking-[0.14em]",
  /** For a badge or a corner marker, where xs is already too loud. */
  micro: "font-mono text-[0.6875rem] uppercase tracking-[0.14em]",
} as const;

/**
 * NUMERALS. The milestones and the price — the only places the site sets a
 * number as the thing you look at rather than as part of a sentence.
 *
 * `tabular-nums` on every tier, non-negotiable: proportional digits give a 1 a
 * narrower advance than an 8, so a column of figures visibly wanders. These sit
 * in grids, so they have to line up.
 *
 * Tracking is uniform rather than Tailwind's `tracking-tight`, which is what
 * three of these used and one didn't — the same reason the headings needed a
 * ladder. Loosened with the rest of the scale when the weight dropped from 700
 * to 500: Rubik's figures are wide, and lining numerals at 500 need the room.
 */
export const FIGURE = {
  /** Inside a card or a dense grid. */
  sm: "text-2xl font-medium tabular-nums tracking-[-0.01em] sm:text-3xl",
  /** A stat band. */
  md: "text-3xl font-medium tabular-nums tracking-[-0.01em] sm:text-4xl",
  /** The price, when it is the anchor of a page. */
  lg: "text-7xl font-medium tabular-nums tracking-[-0.02em] sm:text-8xl",
} as const;

/**
 * The h1 on a task or read page: apply, the FAQ, welcome, an event, a 404.
 *
 * Not for the heroes — those set their own size because the ramp differs when
 * type is the only thing on screen (`HEADING.display`) or sits over a
 * photograph (`HEADING.title`).
 */
export function PageTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn(HEADING.heading, "text-graphite", className)} {...props} />;
}

/**
 * The heading below a SectionTitle. Was written five different ways —
 * `text-2xl font-bold`, `text-xl font-semibold`, `text-lg font-semibold` —
 * for the same job on four pages.
 */
export function Subhead({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn(HEADING.subhead, "text-graphite", className)} {...props} />;
}

export function SectionTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("mt-4 max-w-3xl", HEADING.heading, className)}
      {...props}
    />
  );
}

export function Lede({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
