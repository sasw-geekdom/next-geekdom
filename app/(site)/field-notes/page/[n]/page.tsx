import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { pageMetadata } from "@/lib/seo";
import { indexOrder, listForReaders } from "@/lib/field-notes/notes";
import { CardGrid, Pager, pageCount, pageSlice } from "@/components/field-notes/note-grid";
import { FieldNotesLockup } from "@/components/field-notes/lockup";
import { Lede, MONO, PageTitle, Section } from "@/components/site/section";
import { noteDate } from "@/components/field-notes/note-shelf";
import { cn } from "@/lib/utils";

// Publishing revalidates this on the spot; the hour is the backstop.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

/*
  OLDER FIELD NOTES — /field-notes/page/2 onward. Page 1 is /field-notes
  itself (the featured hero + the first eight), so /page/1 redirects
  there; a page past the end, or anything that isn't a whole number, 404s.
  No featured hero here — it appears once, on the front. The headline is
  the share card's hook ("Stories from the room."), with the page and its
  date range under it — not "Older Field Notes", which said nothing about
  what's here.
*/
const pageOf = (n: string) => (/^[1-9]\d*$/.test(n) ? Number(n) : NaN);

export async function generateMetadata({ params }: PageProps<"/field-notes/page/[n]">): Promise<Metadata> {
  const { n } = await params;
  const page = pageOf(n);
  return pageMetadata({
    title: `Field Notes — page ${Number.isFinite(page) ? page : n}`,
    path: `/field-notes/page/${n}`,
    description: "Stories from the room: what San Antonio's founders and builders are working on and learning from each other, told a frame at a time.",
  });
}

export default async function FieldNotesPage({ params }: PageProps<"/field-notes/page/[n]">) {
  const { n } = await params;
  const page = pageOf(n);
  if (page === 1) permanentRedirect("/field-notes");
  if (!Number.isFinite(page)) notFound();

  const all = indexOrder(await listForReaders());
  const pages = pageCount(all.length);
  if (page > pages) notFound();
  const notes = pageSlice(all, page);

  return (
    <>
      <Section tone="bone-light">
        <FieldNotesLockup />
        {/* The share card's hook, not "Older Field Notes" — an archive page
            still says what Field Notes is. The mono line says where you are. */}
        <PageTitle className="mt-6">Stories from the room.</PageTitle>
        <Lede>
          What San Antonio&rsquo;s founders and builders are working on, working out, and learning from each other —
          told a frame at a time.
        </Lede>
        <p className={cn(MONO.label, "mt-8 text-muted-foreground tabular-nums")}>
          Page {page} of {pages}
          {notes.length > 0 && ` · ${noteDate(notes[notes.length - 1].publishedAt)} – ${noteDate(notes[0].publishedAt)}`}
        </p>
      </Section>
      <Section tone="bone">
        <h2 className="sr-only">
          Field Notes, page {page} of {pages}
        </h2>
        <CardGrid notes={notes} />
        <Pager page={page} pages={pages} className="mt-16" />
      </Section>
    </>
  );
}
