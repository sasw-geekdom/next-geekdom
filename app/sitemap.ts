import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Public pages only. /admin, /account and /welcome are deliberately absent —
 * they're noindex, and listing a noindex URL in a sitemap is a contradiction
 * Search Console reports as an error.
 *
 * The events page isn't given per-event entries: those live on Luma and are
 * that domain's to rank.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/membership", priority: 0.9, changeFrequency: "weekly" },
    { path: "/apply", priority: 0.9, changeFrequency: "monthly" },
    { path: "/the-floor", priority: 0.8, changeFrequency: "monthly" },
    { path: "/events", priority: 0.8, changeFrequency: "daily" },
    { path: "/whats-changing", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
