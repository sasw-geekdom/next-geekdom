import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getNote } from "@/lib/field-notes/notes";
import { PreviewStage } from "@/components/field-notes/preview-stage";
import { Logo } from "@/components/site/logo";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  A FIELD NOTE, PREVIEWED FROM THE DRAFT — before anything is published.

  OUTSIDE /portal ON PURPOSE: under it, the admin sidebar would frame the
  preview, and the point is to see the note as a reader will. So this page
  makes its own staff check (`requireAdmin`), as every admin route does —
  proxy.ts only covers /portal, and the portal layout doesn't wrap this.
  Noindex, and /preview is disallowed in robots.ts.
*/

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function FieldNotePreview(props: PageProps<"/preview/field-notes/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const note = await getNote(id);
  if (!note) notFound();

  return (
    <div className="min-h-screen bg-bone">
      <div className="border-b border-border bg-graphite text-bone">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-10">
          <p className={cn(MONO.label, "text-bone")}>Preview — {note.status === "published" ? "draft changes, not live" : "not published"}</p>
          <Link href={`/portal/admin/field-notes/${note.id}`} className="inline-flex items-center gap-1.5 text-sm text-bone/80 hover:text-bone">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            Back to the editor
          </Link>
        </div>
      </div>
      <header className="mx-auto flex max-w-7xl items-center gap-3 px-6 pt-8 lg:px-10">
        <Logo title="Geekdom" className="h-7 w-auto" />
        <span aria-hidden="true" className="h-5 w-px bg-border" />
        <span className={cn(MONO.label, "text-muted-foreground")}>Field Notes</span>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-16 pt-8 lg:px-10">
        <PreviewStage frames={note.frames} title={note.title || "Untitled Field Note"} />
      </main>
    </div>
  );
}
