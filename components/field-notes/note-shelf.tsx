import Link from "next/link";
import { FrameView } from "@/components/field-notes/frame-view";
import { SideScroller } from "@/components/field-notes/side-scroller";
import { MONO } from "@/components/site/section";
import { fieldNotePath } from "@/lib/field-notes/seo";
import { cn } from "@/lib/utils";
import type { PublishedNote } from "@/lib/field-notes/types";

/*
  A SHELF OF FIELD NOTES — each note's cover frame with its date and author
  under it, the whole card one link. The cover already sets the title and
  dek large, so they aren't repeated beneath it (they were, and it read
  twice); the cover's text is inside the link, so it still names it. It scrolls sideways like the notes
  themselves (SideScroller), newest first. Used by the /field-notes index and
  under each note ("More Field Notes").
*/

export const noteDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Chicago" });

export function NoteShelf({ notes, label = "Field Notes" }: { notes: PublishedNote[]; label?: string }) {
  return (
    <SideScroller
      label={label}
      noun="note"
      itemClassName="w-[min(72cqw,20rem)] @2xl:w-[min(30cqw,20rem)]"
      items={notes.map((n) => ({
        key: n.id,
        node: (
          <Link
            href={fieldNotePath(n.slug)}
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-4 focus-visible:ring-offset-bone"
          >
            {n.frames[0] && (
              <FrameView frame={n.frames[0]} still className="w-full border border-border transition-colors group-hover:border-graphite" />
            )}
            <p className={cn(MONO.label, "mt-4 text-muted-foreground decoration-clay decoration-2 underline-offset-4 group-hover:underline")}>
              {noteDate(n.publishedAt)}
              {n.author ? ` · ${n.author}` : ""}
            </p>
          </Link>
        ),
      }))}
    />
  );
}
