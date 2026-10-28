"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { FrameView } from "@/components/field-notes/frame-view";
import { MONO } from "@/components/site/section";
import { NewNoteButton } from "@/components/admin/field-notes/new-note-button";
import { cn } from "@/lib/utils";
import type { AdminNote } from "@/lib/field-notes/types";

/*
  THE FIELD NOTES LIST. Drafts first (that's the work), then what's live,
  each row its cover thumbnail, title, status and last edit. "New Field
  Note" makes a draft and opens its editor. No search yet — same rule as the
  events list: worth it once the list runs to dozens.
*/

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function Row({ n }: { n: AdminNote }) {
  const cover = n.frames[0];
  return (
    <li className="border-t border-border">
      <Link
        href={`/portal/admin/field-notes/${n.id}`}
        className="group grid grid-cols-[3.5rem_1fr] items-center gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone sm:grid-cols-[3.5rem_1fr_auto]"
      >
        <span className="block w-14">
          {cover ? <FrameView frame={cover} still className="w-full border border-border" /> : <span className="block aspect-[4/5] border border-dashed border-border" />}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-graphite decoration-clay decoration-2 underline-offset-4 group-hover:underline">
            {n.title || "Untitled Field Note"}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {n.author || "No author"} · {n.frames.length} {n.frames.length === 1 ? "frame" : "frames"} · edited {when(n.updatedAt)}
          </span>
        </span>
        <span className="col-start-2 flex gap-2 sm:col-start-3">
          {n.status === "published" ? (
            n.changed ? <Badge tone="pending">Unpublished changes</Badge> : <Badge tone="good">Published {when(n.publishedAt)}</Badge>
          ) : (
            <Badge tone="neutral">Draft</Badge>
          )}
        </span>
      </Link>
    </li>
  );
}

export function NotesManager({ notes }: { notes: AdminNote[] }) {
  const drafts = notes.filter((n) => n.status === "draft");
  const live = notes.filter((n) => n.status === "published");

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-3">
        <NewNoteButton />
      </div>

      {[
        { title: "Drafts", list: drafts, empty: "No drafts. Start one with New Field Note." },
        { title: "Published", list: live, empty: "Nothing published yet." },
      ].map(({ title, list, empty }) => (
        <section key={title}>
          <h2 className={cn(MONO.label, "text-muted-foreground")}>
            {title} · {list.length}
          </h2>
          {list.length === 0 ? (
            <p className="mt-3 border border-dashed border-border bg-bone-light px-6 py-10 text-sm text-muted-foreground">{empty}</p>
          ) : (
            <ul className="mt-3 border-b border-border">
              {list.map((n) => (
                <Row key={n.id} n={n} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
