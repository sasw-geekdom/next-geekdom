import { requireMember } from "@/lib/auth/session";
import { listDirectory, topicsInUse } from "@/lib/directory";
import { getMemberByEmail } from "@/lib/admin/queries";
import { DirectoryBrowser } from "@/components/portal/directory-browser";
import { PortalPage } from "@/components/portal/portal-page";

export const metadata = { title: "Directory" };

/*
  THE MEMBER DIRECTORY — real members (lib/directory.ts), LISTED BY DEFAULT
  at Geekdom's request: everyone current appears unless they switch it off
  at Profile → Edit. Profile fields only — never an email or a phone.
  Members upload their own photo; until then, initials.
*/
export default async function DirectoryPage(props: PageProps<"/portal/directory">) {
  const user = await requireMember();
  const { m, intro } = await props.searchParams;
  const [members, me] = await Promise.all([listDirectory().catch(() => []), getMemberByEmail(user.email).catch(() => null)]);
  return (
    <PortalPage eyebrow="Directory" title="Who's in the room.">
      {members.length ? (
        <DirectoryBrowser members={members} initialId={typeof m === "string" ? m : undefined} meId={me?.id ?? null} popular={topicsInUse(members)} openIntro={intro === "1"} />
      ) : (
        <p className="border border-dashed border-border px-6 py-12 text-sm text-muted-foreground">
          No one is listed yet. Members appear here as they join — and you can choose how you appear at Profile.
        </p>
      )}
    </PortalPage>
  );
}
