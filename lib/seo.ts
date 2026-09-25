import type { Metadata } from "next";
import { POSITIONING, SITE_NAME, SITE_URL } from "@/lib/site";
import { OG_CARDS } from "@/lib/og";

/**
 * The default share card, `app/opengraph-image.png`, at the URL Next serves it
 * from. Resolved against `metadataBase`, so it comes out absolute.
 */
const ROOT_CARD = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  // Declaring the image by path drops the file convention's `.alt.txt`
  // sidecar, so every page on the root card was shipping no og:image:alt.
  // Kept in step with OG_CARDS.home.alt.
  alt: OG_CARDS.home.alt,
};

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
  ownCard = false,
}: {
  /** The page title, WITHOUT the "· Geekdom" suffix — the template adds it. */
  title: string;
  description: string;
  /** Route path with a leading slash. "" for the homepage. */
  path: string;
  robots?: Metadata["robots"];
  /**
   * True when this route's own folder holds an `opengraph-image.png`.
   *
   * THIS EXISTS BECAUSE DECLARING `openGraph` BREAKS IMAGE INHERITANCE, which
   * is not obvious and cost a share card in production. The file convention
   * cascades happily into a page that sets no openGraph of its own —
   * /apply/thanks inherits /apply's card, /welcome inherits the root's. The
   * moment a page declares an openGraph object, only its OWN segment's image
   * file merges in; an ancestor's is dropped.
   *
   * Every page here declares one, to get a per-page canonical and og:url. So
   * the homepage, which has no card in `app/(site)/` — the root card sits one
   * level up, in `app/` — silently ended up with no og:image at all. LinkedIn
   * scraped the page instead and unfurled a partner logo from the marquee.
   *
   * Hence the default below: a page gets the root card unless it says it has
   * its own. Forgetting this on a new page yields the generic card, which is
   * correct; the old behavior yielded nothing, which was not.
   */
  ownCard?: boolean;
}): Metadata {
  /*
    The HOMEPAGE IS THE EXCEPTION, in both titles.

    Every interior page gets "· Geekdom" appended. The document title gets it
    from the root layout's `title.template`; the share title gets it here by
    hand, because a template applies to the document title only and og:title
    would otherwise read "Membership" with no hint of whose membership it is —
    in a feed, next to a stranger's photo.

    The homepage's own title already opens with the name, so both would run it
    twice: "Geekdom — Building San Antonio · Geekdom". Marking it
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
      // Left undefined when the segment has its own file, so Next merges that
      // one — with its content hash, which an explicit path here would lose.
      ...(ownCard ? {} : { images: [ROOT_CARD] }),
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
 * The homepage description, and the site-wide default for pages that set none.
 * One constant, so the layout and the homepage cannot say different things.
 *
 * It carries the positioning line and both engines, because a snippet is the
 * whole of what most people ever read about Geekdom.
 *
 * NO PRICE. It carried "at $100/month", which put the figure in every Google
 * result and link preview for the whole site. Geekdom asked that nothing feel
 * salesy; the price lives on /club's membership card.
 *
 * UNDER 160 CHARACTERS. It ran to 207, and Google cuts a snippet at about 155
 * — mid-word, at the part naming the venture fund.
 */
export const SITE_DESCRIPTION = `${POSITIONING} A members’ club and a venture fund on the third floor of the Rand, downtown. Since 2011.`;
