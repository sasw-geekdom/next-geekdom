import { requireMember } from "@/lib/auth/session";
import { MOCK_DIRECTORY } from "@/data/mock/portal";
import { MOCK_DIRECTORY_MORE } from "@/data/mock/directory-more";
import { DirectoryBrowser } from "@/components/portal/directory-browser";
import { PortalPage } from "@/components/portal/portal-page";

export const metadata = { title: "Directory" };

/*
  The member directory — SAMPLE members until Phase 3 (opt-in, allowlisted
  fields). Sixty invented people so the layout can be judged nearer its real
  size. Their portraits are ILLUSTRATIONS (public/mock/avatars, DiceBear
  "Notionists", CC0), not photographs: invented names on real-looking faces
  would be invented people, and the brand is "Real people, named. No stock."
  Real members upload their own photo.
*/
const SAMPLE = [...MOCK_DIRECTORY, ...MOCK_DIRECTORY_MORE].map((m) => ({
  ...m,
  avatar: m.avatar ?? `/mock/avatars/${m.id}.svg`,
}));

export default async function DirectoryPage(props: PageProps<"/portal/directory">) {
  await requireMember();
  const { m } = await props.searchParams;
  return (
    <PortalPage
      eyebrow="Directory"
      title="Who's in the room."
      notice="Every person and company here is invented, for design review. Portraits are illustrations; members will upload their own photo. Only members who choose to be listed appear in the real directory."
    >
      <DirectoryBrowser members={SAMPLE} initialId={typeof m === "string" ? m : undefined} />
    </PortalPage>
  );
}
