import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getNoteBySlugHistory, getNoteForReaders, indexOrder, isSample, listForReaders } from "@/lib/field-notes/notes";
import { fieldNoteJsonLd, fieldNoteMetadata, fieldNotePath } from "@/lib/field-notes/seo";
import { FrameReader, type NextNote } from "@/components/field-notes/frame-reader";
import { ShareNote } from "@/components/field-notes/share-note";
import { SITE_URL } from "@/lib/site";
import { NoteShelf, noteDate } from "@/components/field-notes/note-shelf";
import { ARROW, Container, HEADING, LINK_ARROW, MONO, Section } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  ONE FIELD NOTE — its frames in the sideways reader, nothing competing.

  READS THE PUBLISHED SNAPSHOT ONLY (getPublishedNote). Draft edits to a live
  note never show here until "Publish changes" in the admin, and publishing
  revalidates this page on the spot.

  RENDERED ON DEMAND, then cached: no params are prebuilt (a build doesn't
  touch Firestore — the repo's rule), and the first visit to each note
  renders and caches it.

  AN OLD SLUG REDIRECTS (308) to the note's current address — the admin keeps
  every slug a note was live under (`previousSlugs`), so a renamed note never
  breaks a link someone shared.
*/

export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps<"/field-notes/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const note = await getNoteForReaders(slug);
  if (!note) return { title: "Field Notes" };
  // A sample (review builds only) is never indexed.
  return isSample(note) ? { ...fieldNoteMetadata(note), robots: { index: false, follow: false } } : fieldNoteMetadata(note);
}

export default async function FieldNotePage(props: PageProps<"/field-notes/[slug]">) {
  const { slug } = await props.params;
  const note = await getNoteForReaders(slug);
  if (!note) {
    const moved = await getNoteBySlugHistory(slug);
    if (moved) permanentRedirect(fieldNotePath(moved.slug));
    notFound();
  }
  const all = indexOrder(await listForReaders());
  const more = all.filter((n) => n.id !== note.id).slice(0, 8);
  // Up next: the note after this one in the index's order, wrapping to the
  // front — so reading the hero leads into the rest of the front page.
  const at = all.findIndex((n) => n.id === note.id);
  const after = all.length > 1 ? all[(at + 1) % all.length] : null;
  const cover = after?.frames[0]?.type === "cover" ? after.frames[0] : null;
  const share = <ShareNote url={`${SITE_URL}${fieldNotePath(note.slug)}`} title={note.title} />;
  const next: NextNote | null = after
    ? { href: fieldNotePath(after.slug), title: after.title, dek: after.dek, series: cover?.series ?? "", image: cover?.image }
    : null;
  const sample = isSample(note);
  // No structured data for a sample — it isn't a real article.
  const jsonLd = sample ? null : JSON.stringify(fieldNoteJsonLd(note)).replace(/</g, "\\u003c");

  return (
    <>
      {/* `<` escaped so a title can't close the script tag early. */}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}

      <article>
        {/*
          SCROLL-DRIVEN: the reader pins under the navbar and the page's
          vertical scroll slides the frames sideways (FrameReader "scroll").
          The compact header rides INSIDE the pin, so the way back and the
          title stay on screen the whole way through the note.
        */}
        <FrameReader
          mode="scroll"
          frames={note.frames}
          next={next}
          label={note.title}
          chrome="13rem"
          header={
            <Container className="flex w-full flex-col gap-2 pb-5 sm:flex-row sm:items-baseline sm:gap-6">
              {/* On a phone, Share rides the back link's row — a fourth header
                  line pushed the frame ~40px down. From sm up it sits last. */}
              <div className="flex items-baseline justify-between gap-4">
                <Link href="/field-notes" className={cn("shrink-0 text-sm", LINK_ARROW)}>
                  <ArrowLeft aria-hidden="true" className={ARROW.back} />
                  Field Notes
                </Link>
                <span className="sm:hidden">{share}</span>
              </div>
              {/* Hidden (not removed) while the cover is on stage — the cover
                  prints the title already; it fades in from the second frame.
                  Desktop only: on a phone the stacked header is the page's
                  title block, and a blank line there read as a bug. */}
              <h1
                className={cn(
                  HEADING.item,
                  "min-w-0 flex-1 text-graphite transition-opacity duration-300 sm:truncate sm:group-data-cover/reader:opacity-0",
                )}
              >
                {note.title}
              </h1>
              <div className="flex shrink-0 flex-wrap items-baseline gap-x-6 gap-y-1">
                <p className={cn(MONO.label, "text-muted-foreground")}>
                  <time dateTime={note.publishedAt}>{noteDate(note.publishedAt)}</time>
                  {note.author ? ` · ${note.author}` : ""}
                </p>
                <span className="hidden sm:block">{share}</span>
              </div>
            </Container>
          }
        />
      </article>

      {more.length > 0 && (
        <Section tone="bone-light">
          <h2 className={cn(MONO.eyebrow, "mb-8 text-muted-foreground")}>More Field Notes</h2>
          <NoteShelf notes={more} label="More Field Notes" />
        </Section>
      )}
    </>
  );
}
