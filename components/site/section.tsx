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

export function Section({
  tone = "sand",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  /** `ink` is the full-bleed dark band; accents inside it must use gold. */
  tone?: "sand" | "white" | "deep" | "ink";
}) {
  const tones = {
    sand: "bg-sand text-ink",
    white: "bg-white text-ink",
    deep: "bg-sand-deep text-ink",
    ink: "bg-ink text-white",
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
 * `onInk` switches the accent from rust to gold. Rust on ink measures 3.3:1 and
 * fails AA for text this size; gold on ink is 9.3:1. See globals.css.
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
        onInk ? "text-gold" : "text-rust",
        className,
      )}
      {...props}
    />
  );
}

/**
 * THE TYPE SCALE.
 *
 * One rule runs through it: as the type gets bigger, the tracking and the
 * leading both tighten. Letterspacing that reads as normal at 24px reads as
 * gappy at 96px, and lines that need 1.08 to breathe at 36px look loose at
 * 96px. So the ladder moves together —
 *
 *   tier      size ramp                        leading   tracking
 *   display   5xl → 7xl → 8xl                  0.98      -0.035em
 *   title     4xl → 6xl → 7xl                  1.02      -0.03em
 *   heading   4xl → 5xl                        1.08      -0.02em
 *   subhead   2xl                              1.2       -0.01em
 *
 * These replace four different tracking values and four different leadings
 * spread across six h1 definitions, none of which differed on purpose — they
 * were each set by eye at the moment that component was written.
 *
 * Sizes live here rather than at the call site so a heading cannot be nudged
 * one step on one page and left everywhere else.
 */
export const HEADING = {
  /** The claim on a page that has nothing else above the fold. */
  display:
    "text-5xl font-bold leading-[0.98] tracking-[-0.035em] sm:text-7xl lg:text-8xl",
  /** A hero with a photograph behind it. */
  title:
    "text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl",
  /** h1 on a task or read page, and every SectionTitle. */
  heading: "text-4xl font-bold leading-[1.08] tracking-[-0.02em] sm:text-5xl",
  /** The tier under a section title — "What's included", "Recently". */
  subhead: "text-2xl font-bold leading-[1.2] tracking-[-0.01em]",
  /**
   * An item title: one benefit in a list, one card in a grid, one step.
   *
   * Added because this tier was being written six different ways for the same
   * job — `font-semibold` with no size (16px), `text-lg font-semibold` (18px),
   * `text-xl font-bold` (20px) and `text-2xl font-bold` (24px) all appeared as
   * h3s across four files. Semibold rather than bold: at this size bold is
   * heavy enough to compete with the section title above it.
   */
  item: "text-lg font-semibold leading-snug",
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
 * Tracking is `-0.02em` throughout rather than Tailwind's `tracking-tight`,
 * which is what three of these used and one didn't — the same reason the
 * headings needed a ladder.
 */
export const FIGURE = {
  /** Inside a card or a dense grid. */
  sm: "text-2xl font-bold tabular-nums tracking-[-0.02em] sm:text-3xl",
  /** A stat band. */
  md: "text-3xl font-bold tabular-nums tracking-[-0.02em] sm:text-4xl",
  /** The price, when it is the anchor of a page. */
  lg: "text-7xl font-bold tabular-nums tracking-[-0.03em] sm:text-8xl",
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
  return <h1 className={cn(HEADING.heading, "text-ink", className)} {...props} />;
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
  return <h2 className={cn(HEADING.subhead, "text-ink", className)} {...props} />;
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
