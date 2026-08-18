import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_URL, SITE_NAME, PROMISE } from "@/lib/site";
import { IS_PREVIEW } from "@/lib/preview";
import { PreviewBadge } from "@/components/site/preview-badge";
import { SiteJsonLd } from "@/components/site/structured-data";
import { SITE_DESCRIPTION } from "@/lib/seo";
import "./globals.css";

/*
  Geist powers the whole type system — Sans for everything you read, Mono for
  everything you scan.

  Both are declared WITHOUT a `weight`, which loads the variable font rather
  than a set of static cuts. That matters here: the display type runs 700 while
  body runs 400 and the eyebrows run 400-with-wide-tracking, and pinning static
  weights would mean shipping four separate files to cover a range one variable
  axis already spans.

  This replaces Rubik, which is the face geekdom.com serves today. Deliberate,
  and the same call the sibling SASTW build made (Geist Sans over that brand's
  Open Sans). The logo is unaffected either way — its letterforms are outlined
  paths in the SVG, so the wordmark still renders in the true brand type no
  matter what the body font is.
*/
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Eyebrows, stat labels, dates, the admin tables — anything read as data
// rather than prose. Its tabular figures are why the dashboard numbers and the
// member roster's dates line up in a column.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
  Geist Pixel is deliberately NOT loaded.

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
    default: `${SITE_NAME} — ${PROMISE}`,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <SiteJsonLd />
        <PreviewBadge />
      </body>
    </html>
  );
}
