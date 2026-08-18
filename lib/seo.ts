import type { Metadata } from "next";
import { priceLabel } from "@/lib/membership";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * One page's metadata, with the parts that DON'T inherit correctly.
 *
 * Next merges metadata down the segment tree, and a field a page doesn't set is
 * inherited from the layout above it. That is the right default for `robots` or
 * `metadataBase` and completely wrong for four fields, which is what this
 * exists to fix:
 *
 *   - `alternates.canonical` — the root declares "/", so every page inherited a
 *     canonical pointing at the homepage. That is the strongest instruction you
 *     can give a search engine, and it was telling Google that /membership,
 *     /the-floor, /events and /faq are all duplicates of / and should not be
 *     indexed in their own right.
 *   - `openGraph.url` — same, for the URL a share unfurls to.
 *   - `openGraph.title` / `.description` — a page setting `title` does NOT
 *     backfill `openGraph.title`; the root's stays. Every page shared to
 *     LinkedIn or iMessage carried the homepage's headline and blurb.
 *   - `twitter.*` — identical story.
 *
 * Verified against the rendered head rather than assumed: before this, a curl
 * of /membership returned og:title "Geekdom — Find your thinking partner."
 *
 * The share IMAGE is not set here. That comes from the `opengraph-image.png`
 * file sitting in each route's own folder, which is a file convention Next
 * resolves per segment — see scripts/og.mjs.
 */
export function pageMetadata({
  title,
  description,
  path,
  /** Pass through for pages that opt out of the index. */
  robots,
}: {
  /** The page title, WITHOUT the "· Geekdom" suffix — the template adds it. */
  title: string;
  description: string;
  /** Route path with a leading slash. "" for the homepage. */
  path: string;
  robots?: Metadata["robots"];
}): Metadata {
  /*
    The HOMEPAGE IS THE EXCEPTION, in both titles.

    Every interior page gets "· Geekdom" appended. The document title gets it
    from the root layout's `title.template`; the share title gets it here by
    hand, because a template applies to the document title only and og:title
    would otherwise read "Membership" with no hint of whose membership it is —
    in a feed, next to a stranger's photo.

    The homepage's own title already opens with the name, so both would run it
    twice: "Geekdom — Find your thinking partner. · Geekdom". Marking it
    absolute opts out of the template, and the share title skips the suffix for
    the same reason.
  */
  const isHome = path === "";
  const shareTitle = isHome ? title : `${title} · ${SITE_NAME}`;

  return {
    title: isHome ? { absolute: title } : title,
    description,
    alternates: { canonical: path || "/" },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${path}`,
      siteName: SITE_NAME,
      locale: "en_US",
      title: shareTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description,
    },
    ...(robots ? { robots } : {}),
  };
}

/**
 * The homepage description, and the site-wide default.
 *
 * Built from `priceLabel()` rather than typed as a literal. The price appears
 * in the search snippet, and a hardcoded "$100 a month" here would quietly go
 * stale the day someone changes MEMBERSHIP_PRICE_CENTS — leaving Google
 * advertising a figure the checkout doesn't charge.
 *
 * Lives here rather than in the root layout because the homepage needs it too:
 * the layout supplies the `description` meta tag for pages that set none, and
 * the homepage supplies its own openGraph description through pageMetadata().
 * One constant, so the two cannot say different things about the same page.
 */
export const SITE_DESCRIPTION = (() => {
  const price = priceLabel();
  return `A space for problem solvers in San Antonio. ${SITE_NAME} is a membership club for founders and builders — one membership${
    price ? `, ${price}` : ""
  }, and a floor full of people who'll break the problem down with you.`;
})();
