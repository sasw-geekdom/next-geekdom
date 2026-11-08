import { readCopyEdits } from "@/lib/content/site-copy";
import { COPY_PAGES, type CopyPageId } from "@/lib/content/site-copy-fields";
import { SiteCopyManager } from "@/components/admin/site-copy-manager";

export const metadata = { title: "Site copy" };

/*
  SITE COPY — the words on the public pages, edited without a developer
  (lib/content/site-copy-fields.ts lists every field). One tab per page,
  in the address (?page=), so a link can open the right one.
*/
export default async function SiteCopyPage(props: PageProps<"/portal/admin/copy">) {
  const { page: raw } = await props.searchParams;
  const page: CopyPageId = COPY_PAGES.some((p) => p.id === raw) ? (raw as CopyPageId) : "home";
  const edits = await readCopyEdits().catch(() => ({}));
  return <SiteCopyManager page={page} edits={edits} />;
}
