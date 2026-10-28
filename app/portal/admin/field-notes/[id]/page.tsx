import { notFound } from "next/navigation";
import { getNote } from "@/lib/field-notes/notes";
import { NoteEditor } from "@/components/admin/field-notes/note-editor";

export async function generateMetadata(props: PageProps<"/portal/admin/field-notes/[id]">) {
  const { id } = await props.params;
  const note = await getNote(id);
  return { title: note?.title ? `${note.title} · Field Notes` : "Field Note" };
}

export default async function FieldNoteEditorPage(props: PageProps<"/portal/admin/field-notes/[id]">) {
  const { id } = await props.params;
  const note = await getNote(id);
  if (!note) notFound();
  // Keyed by id so moving between notes starts a fresh editor.
  return <NoteEditor key={note.id} note={note} />;
}
