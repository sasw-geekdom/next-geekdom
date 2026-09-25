import type { Metadata } from "next";
import { Rubik, IBM_Plex_Mono } from "next/font/google";
import { SITE_URL, SITE_NAME, TITLE_LINE } from "@/lib/site";
import { IS_PREVIEW } from "@/lib/preview";
import { PreviewBadge } from "@/components/site/preview-badge";
import { SiteJsonLd } from "@/components/site/structured-data";
import { SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

/*
  Rubik for everything you read. IBM Plex Mono for everything you scan.

  RUBIK REPLACES GEIST SANS, reversing the call this file used to document. The
  2026 brand guide names Rubik as the workhorse — headlines, subheads, body, UI
  — and Rubik is also the face geekdom.com serves today, so Geist made the
  website the only Geekdom surface not in the brand's type: the Canva kit, the
  decks, the newsletter, the print and the signage all go Rubik. A house face
  that stops at the front door isn't a house face.

  TWO WEIGHTS, 400 AND 500, because the guide allows Regular and Medium and
  says "Never Bold" — so the whole site needs exactly two values, and pinning
  them is what makes that rule enforceable rather than advisory. A stray
  `font-bold` finds no face at 700, matches down to the 500 descriptor, and
  renders at 500, which is visible rather than silently fine.

  WHAT ACTUALLY SHIPS IS THE VARIABLE FONT, and this comment used to claim the
  opposite — "two static cuts". Rubik has no static files on Google Fonts, so
  `weight: ["400", "500"]` gets you the 300–900 variable file declared TWICE,
  once per weight, both @font-face rules pointing at the same `src`. The
  browser pins the `wght` axis to each rule's descriptor, so the rendering is
  right; only the description was wrong.

  IT MATTERS WHEN YOU MEASURE. The file's default instance is Light (300) and
  its name table says "Rubik Light", so reading advance widths straight off
  `.next/static/media` under-reports real 500 type by about 4% — enough to
  make a headline look like it fits in three lines when it needs four. See the
  `display` tier in components/site/section.tsx, which got caught by exactly
  this. Instantiate the axis at 500 before trusting a number.

  NO ITALIC CUT HERE, deliberately. The guide bans italics in the sans outright
  ("If you need italics, switch to Fraunces"), so an italic Rubik would only
  ever be a mistake rendering successfully.

  The logo is unaffected either way — its letterforms are outlined paths in the
  SVG, so the wordmark renders in true brand type whatever the body font is.
*/
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Eyebrows, stat labels, dates, the admin tables — anything read as data
// rather than prose. Its tabular figures are why the dashboard numbers and the
// member roster's dates line up in a column.
//
// IBM PLEX MONO, the face the 2026 guide names for this slot — "metadata,
// timestamps, eyebrows, small technical details". Geist Mono stood in for it
// on the reasoning that the two are interchangeable at 12px tracked-out
// uppercase; they are close, but Plex's slab-serifed i, l and 1 are visibly
// its own, every eyebrow on every page is set in it, and it is free through
// Google Fonts like the other two families. The guide specifies Regular only,
// so 400 is the one weight loaded.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

/*
  Geist Pixel is deliberately NOT loaded.

  (Fraunces, the guide's third family, is loaded the way the last paragraph
  here prescribes: declared on the components that use it, never on this
  layout. See components/site/editorial.tsx.)

  It's the third face in the family and it is genuinely decorative — five shape
  variants on an `ELSH` axis, meant for iconographic use. There's nowhere on
  this site it belongs: a founders' club selling "the person across the table"
  isn't served by a novelty display face, and next/font emits and preloads a
  face for every route whose layout declares it, so an unused third font here
  would sit on the critical path of every page.

  The sibling SASTW repo added it, never found a home for it, and left it as
  dead weight with a comment explaining the same thing. If a real use appears,
  declare it on that component — not on this layout.
*/

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${TITLE_LINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Geekdom",
    "San Antonio startups",
    "San Antonio founders",
    "founder membership",
    "startup community",
    "San Antonio tech",
    "membership club",
    "problem solvers",
  ],
  authors: [{ name: "Geekdom" }],
  creator: "Geekdom",
  /*
    NO `alternates` OR `openGraph` HERE, and that is the fix rather than an
    omission.

    Metadata is inherited down the segment tree, so a canonical declared at the
    root is inherited by every page that doesn't set its own — and this one
    said "/". Every page on the site was telling Google it was a duplicate of
    the homepage and should not be indexed in its own right. `openGraph.url`,
    `.title` and `.description` had the same problem in the share card: a page
    setting `title` does NOT backfill `openGraph.title`, so /membership
    unfurled on LinkedIn as "Geekdom — Find your thinking partner."

    All four now come from `pageMetadata()` in lib/seo.ts, per page. Anything
    left here would inherit again and quietly overwrite nothing — or, worse,
    win.
  */
  // Flipped wholesale on a review deploy. robots.txt already tells crawlers to
  // stay out, but that only governs *fetching* — a URL that gets linked from
  // somewhere can still be indexed without ever being fetched, and the meta tag
  // is what actually prevents that. Both, or neither really holds.
  robots: IS_PREVIEW
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${rubik.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <SiteJsonLd />
        <PreviewBadge />
      </body>
    </html>
  );
}
