import * as React from "react";
import { Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";

/**
 * FRAUNCES — the brand's editorial voice, and the third family in the 2026
 * guide.
 *
 * "Used sparingly for the human moments: pull quotes, member quotes, dinner
 * invitations, retreat materials, the occasional ceremonial line. It's what
 * makes the brand feel like it has range."
 *
 * DECLARED HERE, NOT ON THE ROOT LAYOUT, and that is the whole reason this
 * file exists. next/font emits and preloads a face for every route whose
 * layout declares it, so a third family on app/layout.tsx would sit on the
 * critical path of every page — including the ones with no editorial moment on
 * them at all. The note beside Geist Pixel in the root layout sets out the
 * rule; this is the first font to actually follow it.
 *
 * ITALIC ONLY, WEIGHT 400. The guide never calls for upright Fraunces, and it
 * bans italics in the sans outright ("If you need italics, switch to
 * Fraunces") — so italic Fraunces is the only italic on the site, and loading
 * a roman cut would only make it possible to get that wrong.
 *
 * `opsz` is left at its default. Fraunces carries an optical-size axis and a
 * `SOFT` and `WONK` axis besides; next/font needs an explicit `axes` list to
 * ship them, and none of them earns a second file for the handful of lines
 * this face sets.
 *
 * WHERE IT GOES, per the guide and the website source copy:
 *   - the tagline under the homepage hero
 *   - the pull quote in the members letter
 *   - member and founder quotes
 *   - the Apply page's sub-headline
 *   - the About page's opening line, when that page exists
 *
 * WHERE IT MUST NOT GO: headings, body copy, UI, labels, anything set in mono.
 * If it starts appearing three times on one page it has stopped being the
 * exception and the page needs looking at, not the font.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  display: "swap",
});

/**
 * One editorial line — a tagline, a ceremonial sentence, the line a page turns
 * on.
 *
 * Renders a `<p>` by default; pass `as` for a blockquote or a span where the
 * surrounding markup needs one. Color and size are the caller's, because an
 * editorial line on a graphite band and one under a hero are the same voice at
 * two very different scales.
 */
export function Editorial({
  as: Tag = "p",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "p" | "span" | "blockquote" | "div";
}) {
  return (
    <Tag
      className={cn(fraunces.className, "italic", className)}
      {...props}
    />
  );
}

/**
 * A pull quote: an editorial line set off from the prose around it by a Clay
 * rule down its left edge.
 *
 * The rule is Clay rather than the text being Clay — Clay is 3.5:1 on bone and
 * cannot carry words at this size, but a rule only has to clear 3:1. This is
 * the pattern the whole site uses wherever the accent wants to appear next to
 * something that has to stay readable. See globals.css.
 */
export function PullQuote({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <Editorial
      as="blockquote"
      className={cn(
        "border-l-2 border-clay pl-6 text-2xl leading-[1.45] text-graphite",
        className,
      )}
      {...props}
    />
  );
}
