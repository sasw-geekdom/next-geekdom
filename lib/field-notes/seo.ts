import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { docText, LIMITS, seoDescriptionOf, seoTitleOf } from "@/lib/field-notes/schemas";
import type { NoteContent, PublishedNote } from "@/lib/field-notes/types";

/*
  SEO FOR A FIELD NOTE — built now, for the public page that comes later, and
  used today by the admin's search and share previews so the editor sees
  exactly what will ship.

  Everything derives from the published snapshot: search title (the SEO
  title, or the note's title), the description (SEO description, or the dek),
  the share card (generated at publish, or the uploaded override), and the
  article's dates and author. One source, so the preview can't drift from the
  page.
*/

export const fieldNotePath = (slug: string) => `/field-notes/${slug}`;

/** What Google shows: the URL as it prints it, the title it cuts, the snippet. */
export function searchPreview(c: Pick<NoteContent, "title" | "slug" | "dek" | "seo">) {
  const title = `${seoTitleOf(c) || "Untitled Field Note"} · ${SITE_NAME}`;
  const description = seoDescriptionOf(c);
  return {
    url: `${new URL(SITE_URL).host} › field-notes › ${c.slug || "…"}`,
    title: title.length > LIMITS.seoTitle + 12 ? `${title.slice(0, LIMITS.seoTitle + 9)}…` : title,
    description: description.length > 155 ? `${description.slice(0, 152)}…` : description,
  };
}

/** generateMetadata for /field-notes/[slug] — article, with its own card. */
export function fieldNoteMetadata(note: PublishedNote): Metadata {
  const base = pageMetadata({
    title: seoTitleOf(note),
    description: seoDescriptionOf(note),
    path: fieldNotePath(note.slug),
    ownCard: true,
  });
  const image = { url: note.ogImage, width: 1200, height: 630, alt: note.title };
  return {
    ...base,
    authors: note.author ? [{ name: note.author }] : undefined,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: note.publishedAt,
      modifiedTime: note.updatedAt,
      authors: note.author ? [note.author] : undefined,
      section: "Field Notes",
      images: [image],
    },
    twitter: { ...base.twitter, images: [image] },
  };
}

/**
 * BlogPosting structured data, plus a VideoObject per embedded film. A note
 * is a carousel, so `articleBody` is its text frames joined — what a crawler
 * would otherwise have to reconstruct from slides.
 */
export function fieldNoteJsonLd(note: PublishedNote): Record<string, unknown> {
  const url = `${SITE_URL}${fieldNotePath(note.slug)}`;
  const images = note.frames.flatMap((f) =>
    (f.type === "cover" || f.type === "image") && f.image ? [f.image.src] : [],
  );
  const body = note.frames
    .map((f) =>
      f.type === "text" ? docText(f.doc) : f.type === "quote" ? `“${f.text}” ${f.attribution}` : f.type === "image" ? f.caption : "",
    )
    .filter(Boolean)
    .join("\n\n");
  const videos = note.frames.flatMap((f) => {
    if (f.type !== "video" || !f.video) return [];
    const embedUrl =
      f.video.source === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${f.video.id}`
        : f.video.source === "vimeo"
          ? `https://player.vimeo.com/video/${f.video.id}`
          : undefined;
    return [
      {
        "@type": "VideoObject",
        name: f.caption || note.title,
        description: f.caption || seoDescriptionOf(note),
        uploadDate: note.publishedAt,
        thumbnailUrl: f.poster?.src ?? note.ogImage,
        ...(embedUrl ? { embedUrl } : {}),
        ...(f.video.source === "upload" ? { contentUrl: f.video.url } : {}),
      },
    ];
  });
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: note.title,
    description: seoDescriptionOf(note),
    url,
    mainEntityOfPage: url,
    datePublished: note.publishedAt,
    dateModified: note.updatedAt,
    image: [note.ogImage, ...images],
    author: authorOf(note),
    publisher: { "@type": "Organization", name: SITE_NAME, logo: `${SITE_URL}/brand/kit/geekdom-wordmark-red.png` },
    isPartOf: { "@type": "Blog", name: "Field Notes", url: `${SITE_URL}/field-notes` },
    ...(body ? { articleBody: body } : {}),
    ...(videos.length ? { video: videos } : {}),
  };
}

/** The byline as schema.org — richer when the note closes on an Author frame. */
function authorOf(note: PublishedNote): Record<string, unknown> {
  const close = note.frames.find((f) => f.type === "author");
  const name = (close?.type === "author" && close.name) || note.author;
  if (!name) return { "@type": "Organization", name: SITE_NAME };
  if (close?.type !== "author") return { "@type": "Person", name };
  return {
    "@type": "Person",
    name,
    ...(close.role ? { jobTitle: close.role } : {}),
    ...(close.company ? { worksFor: { "@type": "Organization", name: close.company } } : {}),
    ...(close.portrait ? { image: close.portrait.src } : {}),
    ...(/^https:/.test(close.link) ? { url: close.link } : {}),
  };
}

/** Sitemap rows for live notes — for app/sitemap.ts once the route exists. */
export function fieldNoteSitemapEntries(notes: PublishedNote[]) {
  return notes.map((n) => ({ url: `${SITE_URL}${fieldNotePath(n.slug)}`, lastModified: n.updatedAt }));
}
