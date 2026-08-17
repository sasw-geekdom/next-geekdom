import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { eventSlug, safeUpcomingEvents } from "@/lib/luma";

/**
 * Public pages only. /admin, /account and /welcome are deliberately absent —
 * they're noindex, and listing a noindex URL in a sitemap is a contradiction
 * Search Console reports as an error.
 *
 * Per-event pages ARE listed now. They used to be left out on the grounds that
 * events lived on Luma and were that domain's to rank; each one is a real page
 * on this domain since `/events/[slug]` exists, and an unlisted page on a
 * calendar that turns over weekly is one a crawler may never find in time to
 * matter.
 *
 * UPCOMING ONLY. Past events stay out: they can't be attended, they accumulate
 * without limit, and a sitemap that grows forever with pages nobody can act on
 * spends crawl budget against the pages that convert.
 */
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const routes: {
    path: string;
    priority: number;
    changeFrequency: "daily" | "weekly" | "monthly";
  }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/membership", priority: 0.9, changeFrequency: "weekly" },
    { path: "/apply", priority: 0.9, changeFrequency: "monthly" },
    { path: "/the-floor", priority: 0.8, changeFrequency: "monthly" },
    { path: "/events", priority: 0.8, changeFrequency: "daily" },
    { path: "/whats-changing", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  ];

  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // `safeUpcomingEvents` never throws, so a Luma outage costs the event URLs
  // rather than the whole sitemap.
  const events = await safeUpcomingEvents(50);

  return [
    ...pages,
    ...events.map((event) => ({
      url: `${SITE_URL}/events/${eventSlug(event)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
