import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc, type MemberStatus, type TeamDoc } from "@/lib/firebase/collections";
import { planOf } from "@/lib/membership";
import { sendSafely } from "@/lib/email/resend";
import { teamInviteEmail } from "@/lib/email/member-templates";

/*
  TEAM AND ENTERPRISE ACCOUNTS AS RECORDS (Geekdom, November 2026: "the
  admin team needs an option to create a team and let the team be a
  dropdown that can correctly link to the team members that join").

  Before this, a team was implied: the paying member (the OWNER) with a
  free-text Company, and teammates pointing at them. That stays the
  backbone — billing and status still live on the owner, and lib/team.ts's
  status sync and seat checks keep working — and a `teams` record now sits
  over it: the account's name, plan, seats and owner, with `teamId` on
  the owner and every teammate. Staff create one, pick it from a dropdown
  in a member's slide-out, and see them all on Members → Teams.

  A team record is created automatically wherever an owner appears — a
  Team checkout (the Stripe webhook), an approved Enterprise application,
  or Management moving a member to Team or Enterprise — by ensureTeamFor.
*/

const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];
const teamsCol = () => getAdminDb().collection(COLLECTIONS.teams);
const membersCol = () => getAdminDb().collection(COLLECTIONS.members);

export interface TeamSummary {
  id: string;
  name: string;
  plan: TeamDoc["plan"];
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  /** The owner's status — the team's. */
  status: MemberStatus;
  seats: number | null;
  /** People on it now, owner included (current members only). */
  used: number;
  people: { id: string; name: string; email: string; status: MemberStatus; owner: boolean; billing: boolean }[];
  monthlyCents: number | null;
  /** The owner has a live subscription on Stripe — Enterprise's amount then changes from the next bill. */
  billingActive: boolean;
  createdAt: string;
}

const iso = (t: Timestamp | undefined) => (t ? t.toDate().toISOString() : new Date(0).toISOString());

/** Every team, with its people — one read of each collection. */
export async function listTeams(): Promise<TeamSummary[]> {
  const [teams, members] = await Promise.all([teamsCol().get(), membersCol().where("teamId", "!=", null).get()]);
  const byTeam = new Map<string, { id: string; m: MemberDoc }[]>();
  for (const d of members.docs) {
    const m = d.data() as MemberDoc;
    if (!m.teamId) continue;
    byTeam.set(m.teamId, [...(byTeam.get(m.teamId) ?? []), { id: d.id, m }]);
  }
  return teams.docs
    .map((d) => {
      const t = d.data() as TeamDoc;
      const people = (byTeam.get(d.id) ?? [])
        // Former teammates keep `formerTeamOwnerId` and lose `teamOwnerId`; only the owner and current teammates count.
        .filter(({ id, m }) => id === t.ownerId || m.teamOwnerId === t.ownerId)
        .map(({ id, m }) => ({ id, name: m.name, email: m.email, status: m.status, owner: id === t.ownerId, billing: Boolean(m.stripeSubscriptionId) }))
        .sort((a, b) => Number(b.owner) - Number(a.owner) || a.name.localeCompare(b.name));
      const owner = people.find((p) => p.owner);
      return {
        id: d.id,
        name: t.name,
        plan: t.plan,
        ownerId: t.ownerId,
        ownerName: owner?.name ?? "—",
        ownerEmail: owner?.email ?? "",
        status: owner?.status ?? "canceled",
        seats: t.seats,
        used: people.filter((p) => CURRENT.includes(p.status)).length,
        people,
        monthlyCents: t.monthlyCents ?? null,
        billingActive: Boolean(owner?.billing && CURRENT.includes(owner.status)),
        createdAt: iso(t.createdAt),
      } satisfies TeamSummary;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeamRecord(teamId: string): Promise<(TeamDoc & { id: string }) | null> {
  const snap = await teamsCol().doc(teamId).get();
  return snap.exists ? { id: snap.id, ...(snap.data() as TeamDoc) } : null;
}

type Result = { ok: true; teamId: string; message: string } | { ok: false; error: string };

/**
 * CREATE A TEAM around a member who will pay for it. The owner must be a
 * current member who isn't on (or paying for) another team. Their plan and
 * Company follow the team. One transaction, so two creates can't claim the
 * same owner.
 */
export async function createTeam(input: { name: string; plan: TeamDoc["plan"]; ownerId: string; seats: number | null }, by: string): Promise<Result> {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Name the team — usually the company." };
  const seats = input.plan === "team" ? planOf("team").seats : input.seats;
  const ref = teamsCol().doc();
  try {
    await getAdminDb().runTransaction(async (tx) => {
      const ownerRef = membersCol().doc(input.ownerId);
      const owner = (await tx.get(ownerRef)).data() as MemberDoc | undefined;
      if (!owner) throw new Error("Pick the member who pays for the team.");
      if (!CURRENT.includes(owner.status)) throw new Error(`${owner.name}'s membership isn't active.`);
      if (owner.teamOwnerId) throw new Error(`${owner.name} is already on another team.`);
      if (owner.teamId) throw new Error(`${owner.name} already pays for a team.`);
      // Anyone already pointing at them (the older, implied team) joins the record.
      // Read BEFORE any write — Firestore refuses a read after a write in a transaction.
      const mates = await tx.get(membersCol().where("teamOwnerId", "==", input.ownerId));
      const now = Timestamp.now();
      tx.set(ref, { name, plan: input.plan, ownerId: input.ownerId, seats, monthlyCents: null, createdAt: now, updatedAt: now, createdBy: by } satisfies TeamDoc);
      tx.update(ownerRef, { teamId: ref.id, plan: input.plan, company: name, updatedAt: now });
      for (const d of mates.docs) tx.update(d.ref, { teamId: ref.id, plan: input.plan, company: name, updatedAt: now });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't create the team." };
  }
  return { ok: true, teamId: ref.id, message: `${name} is set up.` };
}

/**
 * The team record for an owner who has a Team or Enterprise plan but no
 * record yet — a Team checkout, an approved Enterprise application, or a
 * plan change. Idempotent: an owner who has one keeps it.
 */
export async function ensureTeamFor(ownerId: string, by: string): Promise<string | null> {
  const owner = (await membersCol().doc(ownerId).get()).data() as MemberDoc | undefined;
  if (!owner || owner.teamOwnerId || owner.teamId) return owner?.teamId ?? null;
  const plan = owner.plan === "team" || owner.plan === "enterprise" ? owner.plan : null;
  if (!plan || !CURRENT.includes(owner.status)) return null;
  const res = await createTeam({ name: owner.company || `${owner.name}'s team`, plan, ownerId, seats: planOf(plan).seats }, by);
  return res.ok ? res.teamId : null;
}

/** Rename, change plan or seats. Every person on it follows the name and plan. Seats can't drop below who's on it. */
export async function updateTeam(teamId: string, input: { name: string; plan: TeamDoc["plan"]; seats: number | null }): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Name the team — usually the company." };
  const seats = input.plan === "team" ? planOf("team").seats : input.seats;
  try {
    await getAdminDb().runTransaction(async (tx) => {
      const ref = teamsCol().doc(teamId);
      const t = (await tx.get(ref)).data() as TeamDoc | undefined;
      if (!t) throw new Error("That team no longer exists.");
      const people = await tx.get(membersCol().where("teamId", "==", teamId));
      const on = people.docs.filter((d) => d.id === t.ownerId || (d.data() as MemberDoc).teamOwnerId === t.ownerId);
      const used = on.filter((d) => CURRENT.includes((d.data() as MemberDoc).status)).length;
      if (seats !== null && used > seats) throw new Error(`${used} people are on the team — remove some before lowering it to ${seats} seats.`);
      const now = Timestamp.now();
      tx.update(ref, { name, plan: input.plan, seats, updatedAt: now });
      for (const d of on) tx.update(d.ref, { company: name, plan: input.plan, updatedAt: now });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't save the team." };
  }
  return { ok: true };
}

/**
 * PUT AN EXISTING MEMBER ON A TEAM — the slide-out's Team dropdown. They
 * become a teammate of the team's owner: plan, Company and status follow
 * the team. Refused when they pay for their own Club subscription (they'd
 * be billed twice — cancel theirs first), when they pay for a team
 * themselves, or when the seats are full.
 */
export async function joinTeam(memberId: string, teamId: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  let name = "";
  let email = "";
  let ownerName = "";
  let teamName = "";
  try {
    await getAdminDb().runTransaction(async (tx) => {
      const tRef = teamsCol().doc(teamId);
      const t = (await tx.get(tRef)).data() as TeamDoc | undefined;
      if (!t) throw new Error("That team no longer exists.");
      const ref = membersCol().doc(memberId);
      const m = (await tx.get(ref)).data() as MemberDoc | undefined;
      if (!m) throw new Error("That member no longer exists.");
      if (memberId === t.ownerId || m.teamOwnerId === t.ownerId) throw new Error(`${m.name} is already on ${t.name}.`);
      if (m.teamId && !m.teamOwnerId) throw new Error(`${m.name} pays for their own team. Move its people first.`);
      if (m.stripeSubscriptionId && CURRENT.includes(m.status) && !m.teamOwnerId)
        throw new Error(`${m.name} pays for their own membership on Stripe. Cancel it first, so they aren't billed twice.`);
      const owner = (await tx.get(membersCol().doc(t.ownerId))).data() as MemberDoc | undefined;
      if (!owner || !CURRENT.includes(owner.status)) throw new Error(`${t.name}'s membership isn't active.`);
      const mates = await tx.get(membersCol().where("teamOwnerId", "==", t.ownerId));
      const used = 1 + mates.docs.filter((d) => CURRENT.includes((d.data() as MemberDoc).status)).length;
      if (t.seats !== null && used >= t.seats) throw new Error(`All ${t.seats} seats on ${t.name} are taken.`);
      tx.update(ref, {
        teamId,
        teamOwnerId: t.ownerId,
        formerTeamOwnerId: FieldValue.delete(),
        plan: t.plan,
        company: t.name,
        status: owner.status,
        updatedAt: Timestamp.now(),
      });
      name = m.name;
      email = m.email;
      ownerName = owner.name;
      teamName = t.name;
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't add them to the team." };
  }
  const mail = teamInviteEmail({ name, ownerName, company: teamName });
  await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  return { ok: true, message: `${name} is on ${teamName}. We've emailed them.` };
}
