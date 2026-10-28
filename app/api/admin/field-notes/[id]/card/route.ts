import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/session";
import { getNote } from "@/lib/field-notes/notes";
import { renderCard } from "@/lib/field-notes/og-card";

/*
  THE SHARE CARD, PREVIEWED FROM THE DRAFT — exactly what `publishNote` will
  generate and store, so the editor shows the real card rather than an
  approximation. Staff only (a route handler runs no layout). Never cached:
  `?v=` changes with every save.
*/
export async function GET(_req: Request, ctx: RouteContext<"/api/admin/field-notes/[id]/card">) {
  if (!(await requireAdminApi())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const note = await getNote(id);
  if (!note) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const png = await renderCard(note);
  return new NextResponse(new Uint8Array(png), {
    headers: { "content-type": "image/png", "cache-control": "private, no-store" },
  });
}
