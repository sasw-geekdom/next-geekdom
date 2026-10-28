"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setFeatured } from "@/lib/field-notes/actions";
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

  FEATURE: one live note can be pinned as the /field-notes hero; pinning
  another moves the pin. With none pinned, the newest note is the hero —
  the list says which is in front either way. The pin isn't content, so it
  takes effect at once, no publish.
*/

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

function FeatureToggle({ n, onError }: { n: AdminNote; onError: (msg: string) => void }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-pressed={n.featured}
      onClick={() =>
        startTransition(async () => {
          const res = await setFeatured(n.id, !n.featured);
          if (!res.ok) onError(res.error ?? "Couldn't change the featured note.");
        })
      }
      className="shrink-0"
    >
      <Star aria-hidden="true" className={cn("size-4", n.featured && "fill-graphite")} />
      {n.featured ? "Unfeature" : "Feature"}
      <span className="sr-only"> “{n.title || "Untitled Field Note"}”</span>
    </Button>
  );
}

function Row({ n, hero, onError }: { n: AdminNote; hero?: "featured" | "newest"; onError?: (msg: string) => void }) {
  const cover = n.frames[0];
  return (
    <li className="flex items-center gap-4 border-t border-border">
      <Link
        href={`/portal/admin/field-notes/${n.id}`}
        className="group grid min-w-0 flex-1 grid-cols-[3.5rem_1fr] items-center gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone sm:grid-cols-[3.5rem_1fr_auto]"
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
        <span className="col-start-2 flex flex-wrap gap-2 sm:col-start-3">
          {hero && <Badge tone="neutral">{hero === "featured" ? "Featured" : "Hero · newest"}</Badge>}
          {n.status === "published" ? (
            n.changed ? <Badge tone="pending">Unpublished changes</Badge> : <Badge tone="good">Published {when(n.publishedAt)}</Badge>
          ) : (
            <Badge tone="neutral">Draft</Badge>
          )}
        </span>
      </Link>
      {n.status === "published" && onError && <FeatureToggle n={n} onError={onError} />}
    </li>
  );
}

export function NotesManager({ notes }: { notes: AdminNote[] }) {
  const drafts = notes.filter((n) => n.status === "draft");
  const live = notes.filter((n) => n.status === "published");
  const [error, setError] = React.useState<string | null>(null);
  // Which note leads /field-notes: the pinned one, else the newest published.
  const pinned = live.find((n) => n.featured);
  const newest = [...live].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];
  const heroOf = (n: AdminNote) => (pinned ? (n === pinned ? "featured" : undefined) : n === newest ? "newest" : undefined);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-center gap-3">
        <NewNoteButton />
      </div>
      {error && (
        <p role="alert" className="text-sm text-geekdom-red">
          {error}
        </p>
      )}

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
                <Row key={n.id} n={n} hero={n.status === "published" ? heroOf(n) : undefined} onError={n.status === "published" ? setError : undefined} />
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
