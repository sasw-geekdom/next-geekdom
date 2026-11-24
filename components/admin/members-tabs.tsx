import { Tabs } from "@/components/admin/admin-ui";

/** People | Teams, at the top of Members (app/portal/admin/members). */
export function MembersTabs({ active, people, teams }: { active: "people" | "teams"; people: number; teams: number }) {
  return (
    <Tabs
      label="Members"
      items={[
        { href: "/portal/admin/members", label: "People", count: people, active: active === "people" },
        { href: "/portal/admin/members/teams", label: "Teams", count: teams, active: active === "teams" },
      ]}
    />
  );
}
