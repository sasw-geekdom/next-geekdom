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
      /*
        NAMED, NOT ONLY "*". A crawler obeys the most specific group that
        matches it and ignores "*" — so a bot listed in its own group with no
        disallows would walk into /portal. One group, every agent, the same
        rules. They're named so the choice is visible: Geekdom wants to be the
        answer when someone asks a model or a search engine about it — search
        crawlers, the AI answer engines, and the training crawlers alike.
      */
      userAgent: [
        "*",
        "Googlebot",
        "Bingbot",
        "Applebot",
        "DuckDuckBot",
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-SearchBot",
        "Claude-User",
        "PerplexityBot",
        "Perplexity-User",
        "Google-Extended",
        "Applebot-Extended",
        "CCBot",
        "meta-externalagent",
      ],
      allow: "/",
      // The staff portal, the billing flow, and the post-checkout pages. All of
      // these already carry `robots: noindex` in their own metadata; this stops
      // crawlers spending budget requesting them at all.
      disallow: ["/admin", "/admin/", "/portal", "/portal/", "/sign-in", "/api/", "/account", "/welcome", "/apply/thanks", "/preview"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
