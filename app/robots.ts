import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { IS_PREVIEW } from "@/lib/preview";

export default function robots(): MetadataRoute.Robots {
  // A review deploy is a full copy of the site on a public URL. Left crawlable
  // it competes with geekdom.com for its own copy, and the sample events go in
  // the index as real ones. No sitemap either — offering a map of pages that
  // are asking not to be crawled works against itself.
  if (IS_PREVIEW) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

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
