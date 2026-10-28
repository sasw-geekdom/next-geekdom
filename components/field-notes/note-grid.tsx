import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ARROW, Container, HEADING, LINK_ARROW, MONO } from "@/components/site/section";
import { FRAUNCES_VARIABLE } from "@/components/site/editorial";
import { FieldNotesLockup } from "@/components/field-notes/lockup";
import { fieldNotePath } from "@/lib/field-notes/seo";
import { cn } from "@/lib/utils";
import type { NoteImage, PublishedNote } from "@/lib/field-notes/types";

/*
  THE FIELD NOTES INDEX, AS A MAGAZINE FRONT, in Geekdom's type:

    geekdom │ FIELD NOTES   ┌──────────────┐
    The newest note's       │  its cover   │
    title, its dek, byline  │  photo, 4:3  │
    Read the story →        └──────────────┘
    More Field Notes ─────────────────────
    [card] [card] [card] [card]               ← eight, then page 2

  The featured note is the hero (`FeaturedNote`), then ONE grid. A row of
  the next four (with deks) sat between them and was cut: two sections of
  the same cards read as a repeat. Headlines are Rubik 500 (the guide sends headings to Rubik, so
  not their serif); dates and series in Plex Mono; the lead's dek in
  Fraunces. On a phone it's one column, lead first.

  THUMBNAILS ARE THE COVER PHOTO, not the cover frame: the frame sets the
  title inside it, so it would print twice. A note with no cover photo gets
  a quiet Bone block with the Field Notes lockup.
*/

const shortDate = (iso: string, withYear = false) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "America/Chicago",
  });

function coverOf(n: PublishedNote): { image?: NoteImage; series: string } {
  const c = n.frames[0];
  return c?.type === "cover" ? { image: c.image, series: c.series } : { series: "" };
}

function Thumb({ note }: { note: PublishedNote }) {
  const { image } = coverOf(note);
  return (
    <span className="block aspect-[3/2] overflow-hidden bg-bone-light">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- graded WebP/JPEG, srcSet for the lead
        <img
          src={image.srcSm}
          srcSet={image.src !== image.srcSm ? `${image.srcSm} 1200w, ${image.src} 2400w` : undefined}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          width={image.width}
          height={image.height}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <span aria-hidden="true" className="flex h-full items-center justify-center border border-border">
          <FieldNotesLockup size="sm" />
        </span>
      )}
    </span>
  );
}

function Meta({ note, className }: { note: PublishedNote; className?: string }) {
  const { series } = coverOf(note);
  return (
    <p className={cn(MONO.label, "text-muted-foreground", className)}>
      {/* The year once it isn't this one — page 3's "APR 6" could be any April. */}
      {shortDate(note.publishedAt, note.publishedAt.slice(0, 4) !== String(new Date().getFullYear()))}
      {series ? ` · ${series.split("│")[0].trim()}` : ""}
    </p>
  );
}

export function NoteCard({ note }: { note: PublishedNote }) {
  return (
    <Link
      href={fieldNotePath(note.slug)}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-4 focus-visible:ring-offset-bone"
    >
      <Thumb note={note} />
      <span className="mt-4 block">
        <span className={cn("block text-graphite decoration-clay decoration-2 underline-offset-4 group-hover:underline", HEADING.item)}>
          {note.title}
        </span>
        {note.author && <span className="mt-2 block text-sm text-graphite/80">By {note.author}</span>}
        <Meta note={note} className="mt-2" />
      </span>
    </Link>
  );
}

/*
  PAGINATION. Page 1 is the featured hero plus one grid of the next
  FIRST_GRID (two full rows); every later page is a grid of PER_PAGE, at
  /field-notes/page/N — real addresses, not "load more", so every note is
  reachable by a crawler and a shared "page 3" link works.
*/
export const FEATURED = 1;
export const FIRST_GRID = 8;
export const PER_PAGE = 16;

export function pageCount(total: number): number {
  return 1 + Math.ceil(Math.max(0, total - FEATURED - FIRST_GRID) / PER_PAGE);
}

/** The notes on page `n` (1-based) of the index. */
export function pageSlice<T>(all: T[], n: number): T[] {
  if (n <= 1) return all.slice(0, FEATURED + FIRST_GRID);
  const start = FEATURED + FIRST_GRID + (n - 2) * PER_PAGE;
  return all.slice(start, start + PER_PAGE);
}

/** The plain card grid — page 1's "More Field Notes", and every later page. */
export function CardGrid({ notes }: { notes: PublishedNote[] }) {
  return (
    <ul className={cn("grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4", FRAUNCES_VARIABLE)}>
      {notes.map((n) => (
        <li key={n.id}>
          <NoteCard note={n} />
        </li>
      ))}
    </ul>
  );
}

/** "← Newer" / "Older →" between index pages. Arrow links, not buttons. */
export function Pager({ page, pages, className }: { page: number; pages: number; className?: string }) {
  if (pages <= 1) return null;
  const href = (n: number) => (n <= 1 ? "/field-notes" : `/field-notes/page/${n}`);
  return (
    <nav aria-label="Field Notes pages" className={cn("flex items-center justify-between gap-6 border-t border-border pt-6", className)}>
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn("text-sm", LINK_ARROW)}>
          <ArrowLeft aria-hidden="true" className={ARROW.back} />
          Newer Field Notes
        </Link>
      ) : (
        <span />
      )}
      <span className={cn(MONO.label, "text-muted-foreground tabular-nums")}>
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className={cn("text-sm", LINK_ARROW)}>
          Older Field Notes
          <ArrowRight aria-hidden="true" className={ARROW.internal} />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/*
  THE FEATURED NOTE IS THE HERO — the newest note as a feature spread INSIDE
  the page's width: the type on the left, its cover photo on the right at
  4:3. Two versions came before it:
  - A full-width lockup row ruled off above the story, with "Stories from
    the room" at its right. It read as a second navbar under the real one,
    so the lockup is now just the label over the title.
  - The photo full-bleed beneath, in SpreadHero's shape. Too wide for an
    index (Jesse's call).
  Nothing sits on the photograph and nothing fades it (Geekdom turned down
  the scrim hero on /club). On a phone it stacks: type, then photo.
*/
export function FeaturedNote({ note }: { note: PublishedNote }) {
  const { image, series } = coverOf(note);
  const href = fieldNotePath(note.slug);
  return (
    <section aria-labelledby="fn-featured" className={cn("bg-bone", FRAUNCES_VARIABLE)}>
      <Container className="grid items-center gap-10 pt-12 pb-16 sm:pt-16 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-20">
        <div className="lg:col-span-5">
          <h1>
            <FieldNotesLockup />
          </h1>
          <h2 id="fn-featured" className={cn("mt-8 text-balance", HEADING.title, "lg:text-5xl xl:text-[3.25rem]")}>
            <Link
              href={href}
              className="text-graphite decoration-clay decoration-2 underline-offset-[0.12em] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-4 focus-visible:ring-offset-bone"
            >
              {note.title}
            </Link>
          </h2>
          {note.dek && (
            <p
              className="mt-6 text-xl leading-[1.4] text-graphite/80"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}
            >
              {note.dek}
            </p>
          )}
          {note.author && <p className="mt-6 text-graphite/80">By {note.author}</p>}
          <p className={cn(MONO.label, "mt-2 text-muted-foreground")}>
            {shortDate(note.publishedAt, true)}
            {series ? ` · ${series.split("│")[0].trim()}` : ""}
          </p>
          <Link href={href} className={cn("mt-8 text-sm", LINK_ARROW)} aria-label={`Read “${note.title}”`}>
            Read the story
            <ArrowRight aria-hidden="true" className={ARROW.internal} />
          </Link>
        </div>
        {image && (
          // The photo repeats the title's link for the pointer only — one tab stop.
          <Link href={href} tabIndex={-1} aria-hidden="true" className="group block overflow-hidden bg-graphite lg:col-span-7">
            {/* eslint-disable-next-line @next/next/no-img-element -- graded WebP/JPEG from Blob */}
            <img
              src={image.src}
              srcSet={image.src !== image.srcSm ? `${image.srcSm} 1200w, ${image.src} 2400w` : undefined}
              sizes="(min-width: 1024px) 640px, 100vw"
              width={image.width}
              height={image.height}
              alt=""
              fetchPriority="high"
              className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </Link>
        )}
      </Container>
    </section>
  );
}

/** Page 1 under the hero: one grid, two full rows. */
export function NoteGrid({ notes }: { notes: PublishedNote[] }) {
  if (notes.length === 0) return null;
  return (
    <section aria-labelledby="fn-more">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <h2 id="fn-more" className={cn(HEADING.subhead, "text-graphite")}>
          More Field Notes
        </h2>
      </div>
      <div className="mt-10">
        <CardGrid notes={notes.slice(0, FIRST_GRID)} />
      </div>
    </section>
  );
}
