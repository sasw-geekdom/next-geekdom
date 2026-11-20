import { can } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { readPerkTags } from "@/lib/perks-server";
import { compActive } from "@/lib/perks";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { TagsManager } from "@/components/admin/tags-manager";

export const metadata = { title: "Tags & perks" };

/*
  TAGS & PERKS (Settings) — the tags staff put on members, and what a PERK
  tag does to billing ("DEVSA community": complimentary for 12 months from
  the day it's applied). Management creates and changes them; every admin can
  read the list. Tags are APPLIED in a member's slide-out (Members), where
  a perk starts the member's complimentary period and pauses any Stripe
  billing (lib/perks-server.ts). One read of the members for the counts.
*/
export default async function TagsPage(props: PageProps<"/portal/admin/tags">) {
  const { new: startNew } = await props.searchParams;
  const me = await requireAdmin();
  const [defs, snap] = await Promise.all([readPerkTags(), getAdminDb().collection(COLLECTIONS.members).get()]);
  const members = snap.docs.map((d) => d.data() as MemberDoc);
  const now = new Date().getTime();
  const counts = Object.fromEntries(
    defs.map((t) => [
      t.name,
      {
        tagged: members.filter((m) => (m.tags ?? []).includes(t.name)).length,
        complimentary: members.filter((m) => compActive(m.comp, now) && m.comp?.tag === t.name).length,
      },
    ]),
  );
  // Tags staff have typed on members that have no definition here — plain labels.
  const undefinedTags = [...new Set(members.flatMap((m) => m.tags ?? []))]
    .filter((t) => !defs.some((d) => d.name === t))
    .sort()
    .map((name) => ({ name, count: members.filter((m) => (m.tags ?? []).includes(name)).length }));

  return (
    <>
      <PageHeader title="Tags & perks" description="Labels for members — and perks that make a membership complimentary." />
      <AdminSection>
        <TagsManager tags={defs} counts={counts} otherTags={undefinedTags} canManage={can(me.role, "tags.define")} startNew={startNew === "1"} />
      </AdminSection>
    </>
  );
}
