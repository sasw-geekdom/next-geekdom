import { requireAdmin } from "@/lib/auth/session";
import { listAdminPeople } from "@/lib/admin/team";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { TeamAccessManager } from "@/components/admin/team-access-manager";

export const metadata = { title: "Admin access" };

/*
  ADMIN ACCESS — who can sign in to this admin, and the scope of work's
  "manage administrative user access". Every admin can see the list; only
  owners can add or remove people (the actions check, not just the
  buttons). lib/auth/admin-access.ts has the rules.
*/
export default async function TeamPage() {
  const me = await requireAdmin();
  const people = await listAdminPeople();
  const live = people.filter((p) => !p.removed);
  return (
    <>
      <PageHeader title="Admin access" description={`${live.length} ${live.length === 1 ? "person has" : "people have"} access to this admin.`} />
      <AdminSection>
        <TeamAccessManager people={people} canManage={me.role === "superadmin"} me={me.email.toLowerCase()} />
      </AdminSection>
    </>
  );
}
