"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { adminAllowed } from "@/lib/auth/session";
import { MANAGEMENT_ONLY_MESSAGE } from "@/lib/auth/roles";
import { logActivity } from "@/lib/admin/activity";
import { createTeam, getTeamRecord, updateTeam } from "@/lib/teams";

/*
  MEMBERS → TEAMS (lib/teams.ts). Creating a team and changing its plan or
  seats is MANAGEMENT's (`members.money` — it changes what's billed);
  adding and taking off people is every admin's, through the same actions
  as a member's slide-out (lib/admin/member-actions.ts).
*/

const teamSchema = z.object({
  name: z.string({ error: "Name the team — usually the company." }).trim().min(2, "Name the team — usually the company.").max(120),
  plan: z.enum(["team", "enterprise"], { error: "Pick Team or Enterprise." }),
  // Enterprise only; blank = no cap.
  seats: z.number().int().min(2, "At least 2 seats.").max(1000).nullable(),
});

function refresh() {
  revalidatePath("/portal/admin/members/teams");
  revalidatePath("/portal/admin/members");
  revalidatePath("/portal/profile");
}

export async function createTeamAction(input: z.input<typeof teamSchema> & { ownerId: string }) {
  const user = await adminAllowed("members.money");
  if (!user) return { ok: false as const, error: MANAGEMENT_ONLY_MESSAGE };
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the team and try again." };
  if (typeof input.ownerId !== "string" || !input.ownerId) return { ok: false as const, error: "Pick the member who pays for the team." };
  const res = await createTeam({ ...parsed.data, ownerId: input.ownerId }, user.name || user.email);
  if (!res.ok) return { ok: false as const, error: res.error };
  await logActivity(user, { area: "members", action: "created the team", label: parsed.data.name, href: "/portal/admin/members/teams" });
  refresh();
  return { ok: true as const, teamId: res.teamId, message: res.message };
}

export async function updateTeamAction(teamId: string, input: z.input<typeof teamSchema>) {
  const user = await adminAllowed("members.money");
  if (!user) return { ok: false as const, error: MANAGEMENT_ONLY_MESSAGE };
  const parsed = teamSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the team and try again." };
  if (typeof teamId !== "string" || !(await getTeamRecord(teamId))) return { ok: false as const, error: "That team no longer exists." };
  const res = await updateTeam(teamId, parsed.data);
  if (!res.ok) return { ok: false as const, error: res.error };
  await logActivity(user, { area: "members", action: "edited the team", label: parsed.data.name, href: "/portal/admin/members/teams" });
  refresh();
  return { ok: true as const, message: "Saved." };
}
