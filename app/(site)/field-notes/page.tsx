import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { indexOrder, listForReaders } from "@/lib/field-notes/notes";
import { FeaturedNote, NoteGrid, Pager, pageCount, pageSlice } from "@/components/field-notes/note-grid";
import { FieldNotesLockup } from "@/components/field-notes/lockup";
import { Lede, PageTitle, Section } from "@/components/site/section";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "Field Notes",
  path: "/field-notes",
  description:
    "Field Notes from Geekdom — stories from San Antonio's founders and builders, told a frame at a time.",
});

// Publishing revalidates this on the spot (lib/field-notes/actions.ts);
// the hour is the backstop.
export const revalidate = 3600;

/*
  FIELD NOTES — the index. Geekdom's stories, each a carousel of frames read
  sideways (Jesse's reference: an Instagram carousel). The index is a
  magazine front (components/field-notes/note-grid.tsx): the newest note as
  the hero, then the next eight as one card grid. Older notes are paged at
  /field-notes/page/N (page/[n]/page.tsx), linked from the foot.

  THE HERO IS THE NEWEST NOTE (`FeaturedNote`): the lockup is the page's h1,
  at label scale, and the featured story's title carries the display size.

  IN THE FOOTER, NOT THE NAV (Jesse's call): the nav names the two things you
  can join and Apply, nothing else.

  The source copy said to hide this page "until we populate with several
  articles". It's linked now at Geekdom's request, so the empty state says
  what's coming rather than looking broken.
*/
export default async function FieldNotesPage() {
  const notes = indexOrder(await listForReaders());
  const pages = pageCount(notes.length);
  const [featured, ...rest] = pageSlice(notes, 1);

  if (!featured) {
    return (
      <>
        <Section tone="bone-light">
          <FieldNotesLockup />
          <PageTitle className="mt-6">Stories from the room.</PageTitle>
          <Lede>
            What San Antonio&rsquo;s founders and builders are working on, working out, and learning from each
            other — told a frame at a time.
          </Lede>
        </Section>
        <Section tone="bone">
          <div className="max-w-xl border border-dashed border-border px-8 py-12">
            <h2 className="text-lg text-graphite">The first Field Notes are on their way.</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Stories from the third floor, as soon as they&rsquo;re written.
            </p>
          </div>
        </Section>
      </>
    );
  }

  return (
    <>
      <FeaturedNote note={featured} />
      <Section tone="bone-light">
        <NoteGrid notes={rest} />
        {pages > 1 && <Pager page={1} pages={pages} className="mt-16" />}
      </Section>
    </>
  );
}
