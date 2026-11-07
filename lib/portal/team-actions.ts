"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
import { getMemberByEmail } from "@/lib/admin/queries";
import { addTeammate, removeTeammate } from "@/lib/team";
import { logActivity } from "@/lib/admin/activity";
import { hasTeam } from "@/lib/membership";

/*
  THE OWNER MANAGES THEIR TEAM (Profile → Your team).

  The owner is resolved from the SESSION, never from the form: a server
  action is a public POST endpoint, and an owner id in the request would
  let anyone manage anyone's team. A teammate (who has `teamOwnerId`) is
  not an owner and can't add or remove anyone. Logged to the activity log
  so staff can see who changed a team.
*/

export type TeamActionResult = { ok: true; message: string } | { ok: false; error: string; field?: "name" | "email" };

async function owner() {
  const user = await requireMember();
  const member = await getMemberByEmail(user.email);
  if (!member || member.teamOwnerId || !hasTeam(member.plan)) return null;
  return member;
}

function refresh() {
  revalidatePath("/portal/profile");
  revalidatePath("/portal/directory");
  revalidatePath("/portal/admin/members");
}

export async function addMyTeammate(input: { name: string; email: string }): Promise<TeamActionResult> {
  const me = await owner();
  if (!me) return { ok: false, error: "Only the person who holds a Team or Enterprise membership can add teammates." };
  const res = await addTeammate(me.id, { name: String(input?.name ?? ""), email: String(input?.email ?? "") });
  if (res.ok) {
    await logActivity({ email: me.email, name: me.name }, { area: "members", action: "added to their team", label: String(input.name), href: "/portal/admin/members" });
    refresh();
  }
  return res;
}

export async function removeMyTeammate(teammateId: string): Promise<TeamActionResult> {
  const me = await owner();
  if (!me) return { ok: false, error: "Only the person who holds the membership can remove teammates." };
  if (typeof teammateId !== "string" || !teammateId) return { ok: false, error: "Missing teammate." };
  const res = await removeTeammate(me.id, teammateId);
  if (res.ok) {
    await logActivity({ email: me.email, name: me.name }, { area: "members", action: "removed from their team", label: res.message.replace(" is off the team.", ""), href: "/portal/admin/members" });
    refresh();
  }
  return res;
}
