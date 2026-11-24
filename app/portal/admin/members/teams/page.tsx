import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { listMembers } from "@/lib/admin/queries";
import { listTeams } from "@/lib/teams";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { MembersTabs } from "@/components/admin/members-tabs";
import { TeamsManager } from "@/components/admin/teams-manager";

export const metadata = { title: "Teams" };

/*
  MEMBERS → TEAMS (lib/teams.ts): Team and Enterprise accounts. A tab on
  Members, not a sidebar row — teams are members, and the sidebar is sized
  to fit a 900px window. Under /members so Members stays highlighted.
*/
export default async function TeamsPage() {
  const me = await requireAdmin();
  const [teams, members] = await Promise.all([listTeams(), listMembers()]);
  const CURRENT = ["active", "trialing", "past_due"];
  // Who can pay for a NEW team: a current member who isn't on, or paying for, one.
  const owners = members
    .filter((m) => CURRENT.includes(m.status) && !m.teamId && !m.teamOwnerId)
    .map((m) => ({ id: m.id, name: m.name, email: m.email }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const people = members.filter((m) => CURRENT.includes(m.status)).length;
  return (
    <>
      <PageHeader title="Members" description="Team and Enterprise accounts — who pays, and who's on them." />
      <AdminSection>
        <MembersTabs active="teams" people={people} teams={teams.length} />
        <div className="mt-6">
          <TeamsManager teams={teams} owners={owners} canManage={can(me.role, "members.money")} />
        </div>
      </AdminSection>
    </>
  );
}
