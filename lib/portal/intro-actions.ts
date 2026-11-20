"use server";

import { Timestamp } from "firebase-admin/firestore";
import { requireMember } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { getMemberByEmail } from "@/lib/admin/queries";
import { sendSafely } from "@/lib/email/resend";
import { centralDay } from "@/lib/rooms/rules";
import { INTRO_NOTE_MAX, INTRO_NOTE_MIN } from "@/lib/intro-rules";
import { introRequestEmail, url } from "@/lib/email/member-templates";

/*
  "ASK FOR AN INTRO" in the directory (Jesse, November 2026). The directory
  never shows an email, so this is how one member reaches another: Geekdom
  sends the recipient a short email — who's asking, their profile, their
  note — with Reply-To set to the asker. Replying is the whole answer, and
  the recipient's address stays private until they choose to.

  Guard rails, checked in one transaction so two quick clicks can't slip
  past them:
    · members only, from the SESSION (never an id from the browser), to a
      CURRENT, LISTED member who isn't themselves;
    · a note of 20–1,000 characters (an intro is a reason, not a ping);
    · 5 a day per member (`introLimits/{id}_{day}`, Central days);
    · the same person once a week (`introLimits/pair_{from}_{to}`).
  What's kept (`intros`): who to whom, and when — NEVER the note, which is
  between the two of them.
*/

const CURRENT = ["active", "trialing", "past_due"];
const PER_DAY = 5;
const PAIR_GAP_MS = 7 * 86_400_000;

export async function requestIntro(toId: string, rawNote: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email);
  if (!me) return { ok: false, message: "Intros are between members — this account has no membership." };
  if (typeof toId !== "string" || !toId || toId === me.id) return { ok: false, message: "Pick someone else to meet." };
  const note = typeof rawNote === "string" ? rawNote.trim() : "";
  if (note.length < INTRO_NOTE_MIN) return { ok: false, message: "Say a little about why you'd like to meet — a sentence or two." };
  if (note.length > INTRO_NOTE_MAX) return { ok: false, message: `Keep it under ${INTRO_NOTE_MAX.toLocaleString("en-US")} characters.` };

  const db = getAdminDb();
  const toRef = db.collection(COLLECTIONS.members).doc(toId);
  const dayRef = db.collection(COLLECTIONS.introLimits).doc(`${me.id}_${centralDay(new Date())}`);
  const pairRef = db.collection(COLLECTIONS.introLimits).doc(`pair_${me.id}_${toId}`);
  let to: MemberDoc;
  try {
    to = await db.runTransaction(async (tx) => {
      const [toSnap, day, pair] = await Promise.all([tx.get(toRef), tx.get(dayRef), tx.get(pairRef)]);
      const t = toSnap.data() as MemberDoc | undefined;
      if (!t || !CURRENT.includes(t.status) || t.profile?.listed === false) throw new Error("That member isn't in the directory any more.");
      if ((day.data()?.count ?? 0) >= PER_DAY) throw new Error(`That's ${PER_DAY} intros today — the limit. Try again tomorrow.`);
      const last = pair.data()?.at as Timestamp | undefined;
      if (last && Date.now() - last.toMillis() < PAIR_GAP_MS) throw new Error(`You asked ${t.name.split(" ")[0]} for an intro recently — give them a few days to reply.`);
      tx.set(dayRef, { count: (day.data()?.count ?? 0) + 1, memberId: me.id }, { merge: true });
      tx.set(pairRef, { at: Timestamp.now(), from: me.id, to: toId });
      tx.create(db.collection(COLLECTIONS.intros).doc(), { fromId: me.id, toId, at: Timestamp.now() });
      return t;
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't send that. Try again." };
  }

  const mail = introRequestEmail({
    toName: to.name,
    fromName: me.name,
    fromHeadline: me.profile?.headline ?? "",
    fromTopics: me.profile?.askMeAbout ?? [],
    note,
    profileUrl: url(`/portal/directory?m=${me.id}`),
  });
  const sent = await sendSafely({ to: to.email, subject: mail.subject, html: mail.html, text: mail.text, replyTo: me.email });
  if (!sent) return { ok: false, message: "Your note didn't send — try again in a minute." };
  return { ok: true, message: `Sent. If ${to.name.split(" ")[0]} replies, it comes straight to your email.` };
}
