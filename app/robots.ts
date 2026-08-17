import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The staff portal, the billing flow, and the post-checkout pages. All of
      // these already carry `robots: noindex` in their own metadata; this stops
      // crawlers spending budget requesting them at all.
      disallow: ["/admin", "/admin/", "/api/", "/account", "/welcome", "/apply/thanks"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
