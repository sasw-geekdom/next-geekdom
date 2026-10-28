import { listNotes } from "@/lib/field-notes/notes";
import { NotesManager } from "@/components/admin/field-notes/notes-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";

export const metadata = { title: "Field Notes" };

/*
  FIELD NOTES — Geekdom's blog, written here. A note is a carousel of
  frames read sideways (components/field-notes/frame-reader.tsx). The public
  /field-notes page isn't built yet; publishing a note now means it goes live
  the moment it is. See lib/field-notes/.
*/
export default async function AdminFieldNotesPage() {
  const notes = await listNotes();
  return (
    <>
      <PageHeader
        eyebrow="Site content"
        title="Field Notes"
        description="The blog, as carousels — each note a set of frames read sideways."
      />
      <AdminSection>
        <NotesManager notes={notes} />
      </AdminSection>
    </>
  );
}
