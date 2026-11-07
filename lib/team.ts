import "server-only";

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc, type MemberStatus } from "@/lib/firebase/collections";
import { planOf } from "@/lib/membership";
import { ensureLogin } from "@/lib/admin/member-logins";
import { sendSafely } from "@/lib/email/resend";
import { teamInviteEmail, teamRemovedEmail } from "@/lib/email/member-templates";

/*
  TEAMS — a Team (10 seats, the owner included) or Enterprise (no fixed cap)
  membership is one company's, and each person on it is a MEMBER IN THEIR
  OWN RIGHT: their own `members` record, their own login, their own
  directory profile. That keeps "a membership is one person" true for
  sign-in and the directory — no shared logins, no special cases there.

  A teammate's record points at the OWNER (`teamOwnerId`) — the member who
  applied and pays. The owner's status is the team's: when it changes
  (Stripe, or staff), `syncTeamStatus` copies it to every teammate, so a
  canceled or past-due owner takes the team with them.

  Removing a teammate cancels their record and moves the link to
  `formerTeamOwnerId`, so the seat frees up and the history stays.

  Used by the owner (Profile → Your team) and by staff (Members). Callers
  check who's asking; these functions check what's allowed.
*/

const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];
const members = () => getAdminDb().collection(COLLECTIONS.members);

export interface Teammate {
  id: string;
  name: string;
  email: string;
  status: MemberStatus;
}

export interface Team {
  ownerId: string;
  ownerName: string;
  company: string;
  /** Owner included. Null = no cap. */
  seats: number | null;
  /** Teammates only (not the owner). */
  teammates: Teammate[];
}

/** The team a member owns, or null if their plan has no team. */
export async function getTeam(ownerId: string): Promise<Team | null> {
  const ownerSnap = await members().doc(ownerId).get();
  const owner = ownerSnap.data() as MemberDoc | undefined;
  if (!owner || owner.teamOwnerId || planOf(owner.plan).seats === 1) return null;
  const snap = await members().where("teamOwnerId", "==", ownerId).get();
  return {
    ownerId,
    ownerName: owner.name,
    company: owner.company ?? "",
    seats: planOf(owner.plan).seats,
    teammates: snap.docs
      .map((d) => {
        const m = d.data() as MemberDoc;
        return { id: d.id, name: m.name, email: m.email, status: m.status };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

type Result = { ok: true; message: string } | { ok: false; error: string; field?: "name" | "email" };

/**
 * Add someone to an owner's team: a new member record (or a former
 * member's, reused — one person, one record), their login, and the
 * invitation email. The seat check and the write are one transaction, so
 * two adds at once can't overfill the team.
 */
export async function addTeammate(ownerId: string, input: { name: string; email: string }): Promise<Result> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 2) return { ok: false, error: "Add their name.", field: "name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Add a valid email — it's the one they'll sign in with.", field: "email" };

  const ownerRef = members().doc(ownerId);
  let ownerName = "";
  let company = "";
  try {
    await getAdminDb().runTransaction(async (tx) => {
      const ownerSnap = await tx.get(ownerRef);
      const owner = ownerSnap.data() as MemberDoc | undefined;
      if (!owner || owner.teamOwnerId) throw new Error("That membership doesn't have a team.");
      const plan = planOf(owner.plan);
      if (plan.seats === 1) throw new Error(`A ${plan.name} membership is for one person. Team and Enterprise memberships have seats.`);
      if (!CURRENT.includes(owner.status)) throw new Error("The membership isn't active, so teammates can't be added.");
      if (owner.email === email) throw new Error("That's the team owner's own email.");
      ownerName = owner.name;
      company = owner.company ?? "";

      const team = await tx.get(members().where("teamOwnerId", "==", ownerId));
      if (plan.seats !== null && team.size + 1 >= plan.seats) {
        throw new Error(`All ${plan.seats} seats are taken. Remove someone to add someone new.`);
      }
      const clash = await tx.get(members().where("email", "==", email).limit(1));
      const existing = clash.docs[0];
      const now = Timestamp.now();
      if (existing) {
        const m = existing.data() as MemberDoc;
        if (m.teamOwnerId === ownerId) throw new Error(`${m.name} is already on this team.`);
        if (CURRENT.includes(m.status)) {
          throw new Error(`${m.name} already has their own Geekdom membership under that email.`);
        }
        // A former member coming back as a teammate keeps their one record.
        tx.update(existing.ref, {
          name,
          status: owner.status,
          plan: owner.plan ?? plan.id,
          company: company || FieldValue.delete(),
          teamOwnerId: ownerId,
          formerTeamOwnerId: FieldValue.delete(),
          updatedAt: now,
        });
      } else {
        const doc: Partial<MemberDoc> = {
          name,
          email,
          status: owner.status,
          plan: owner.plan ?? plan.id,
          ...(company ? { company } : {}),
          teamOwnerId: ownerId,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          joinedAt: now,
          updatedAt: now,
          source: "team",
        };
        tx.set(members().doc(), doc);
      }
    });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Couldn't add them.";
    return { ok: false, error, ...(error.includes("email") || error.includes("already") ? { field: "email" as const } : {}) };
  }

  const login = await ensureLogin(email, name);
  const mail = teamInviteEmail({ name, ownerName, company });
  const sent = await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  if (!login.ok) return { ok: true, message: `${name} is on the team, but their sign-in couldn't be set up: ${login.error}` };
  return { ok: true, message: sent ? `${name} is on the team. We've emailed them how to sign in.` : `${name} is on the team. (The invitation email didn't send — tell them to sign in at /sign-in.)` };
}

/** Take a teammate off: access ends on their next request; the seat frees up. */
export async function removeTeammate(ownerId: string, teammateId: string): Promise<Result> {
  const ref = members().doc(teammateId);
  const snap = await ref.get();
  const m = snap.data() as MemberDoc | undefined;
  if (!m || m.teamOwnerId !== ownerId) return { ok: false, error: "They're not on this team." };
  const owner = (await members().doc(ownerId).get()).data() as MemberDoc | undefined;
  await ref.update({
    status: "canceled",
    teamOwnerId: FieldValue.delete(),
    formerTeamOwnerId: ownerId,
    updatedAt: Timestamp.now(),
  });
  const mail = teamRemovedEmail({ name: m.name, company: owner?.company ?? "" });
  await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text });
  return { ok: true, message: `${m.name} is off the team.` };
}

/**
 * The owner's status is the team's. Called wherever an owner's status
 * changes — the Stripe webhook, and staff saving a member — so a lapsed or
 * canceled owner takes their teammates with them, and a reactivated one
 * brings them back.
 */
export async function syncTeamStatus(ownerId: string, status: MemberStatus): Promise<number> {
  const snap = await members().where("teamOwnerId", "==", ownerId).get();
  const stale = snap.docs.filter((d) => (d.data() as MemberDoc).status !== status);
  if (!stale.length) return 0;
  const batch = getAdminDb().batch();
  for (const d of stale) batch.update(d.ref, { status, updatedAt: Timestamp.now() });
  await batch.commit();
  return stale.length;
}
