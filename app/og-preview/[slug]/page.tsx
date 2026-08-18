import { notFound } from "next/navigation";
import { OgCard } from "@/components/site/og-card";
import { OG_CARDS } from "@/lib/og";

/**
 * The share cards, on screen, so a browser can photograph them.
 *
 * DEVELOPMENT ONLY — 404 in production, and the guard is the first thing that
 * runs. The cards themselves ship as PNGs committed next to each route; this
 * route exists purely so `npm run og` has something to point Chrome at, and a
 * route whose only consumer is a build script has no business being reachable
 * on geekdom.com.
 *
 * `NODE_ENV` is the right gate here, unlike the preview-mode flag next door in
 * lib/preview.ts. That one has to check the domain because a review deploy is a
 * production Vercel build and reports itself as one. This is the opposite
 * question — not "which deployment is this" but "is this a build at all" — and
 * `next build` sets NODE_ENV=production for the review deploy too, which is
 * exactly what we want: the route is absent from every deployment, review URL
 * included.
 *
 * Deliberately outside the (site) route group, so it renders with no navbar,
 * no footer, and nothing else that would land inside the crop.
 *
 * NO `generateStaticParams`. It looks like the right thing for a fixed set of
 * seven slugs, and it is exactly wrong here: prerendering runs at build time,
 * where the guard above has already fired, so the build spent its time
 * rendering and shipping seven static copies of a 404 page. Left dynamic, the
 * route costs production nothing at all.
 */

export default async function OgPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { slug } = await params;
  if (!OG_CARDS[slug]) notFound();

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-900">
      {/*
        Next's dev-tools badge floats bottom-left, which is INSIDE the crop —
        the window is exactly 1200×630 and the card fills it, so the little
        black circle was landing in the corner of every finished share card.
        Hidden here rather than through `devIndicators`, so the setting stays
        on everywhere it is actually useful.
      */}
      <style>{`nextjs-portal { display: none !important; }`}</style>
      <OgCard slug={slug} />
    </main>
  );
}
