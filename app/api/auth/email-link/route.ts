import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import * as z from "zod";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc, type MemberStatus } from "@/lib/firebase/collections";
import { resolveAdminRole } from "@/lib/auth/roles";
import { ensureLogin } from "@/lib/admin/member-logins";
import { sendSafely } from "@/lib/email/resend";
import { signInLinkEmail } from "@/lib/email/member-templates";
import { isBot } from "@/lib/botid";
import { SITE_URL } from "@/lib/site";

/*
  THE SIGN-IN LINK, SENT BY GEEKDOM — not Firebase.

  Firebase's own email-link mail ("We received a request to sign in to
  project-geekdom…") can't be reworded in its console. So the link is made
  here with the Admin SDK (`generateSignInWithEmailLink`, the same link
  Firebase would send) and mailed through Resend in the brand
  (signInLinkEmail). The browser finishes sign-in exactly as before.

  WHO GETS ONE: staff (the domain / SUPER_ADMIN_EMAILS) and current members.
  Their Firebase account is created here if it doesn't exist yet — which is
  what lets staff in once self sign-up is turned off, with nobody adding them
  by hand. Anyone else gets nothing, and is TOLD so.

  IT SAYS "NO MEMBERSHIP UNDER THAT EMAIL" — on purpose, Jesse's call. It
  used to answer `{ ok: true }` for everyone so the form couldn't reveal who
  is a member, and a non-member was shown "Check your inbox" for a link that
  would never come: one step from a door that wasn't there. The cost of
  telling them is that the form now answers "is X a member?", so LOOKUPS are
  capped per IP (LOOKUPS_PER_WINDOW) — enough for someone retrying their own
  addresses, useless for running a list. Former members (paused, canceled)
  are told their membership isn't active and to write to club@ — they were
  members, and "no membership under that email" would read as lost data.

  Throttled per address too (one link a minute) so the button can't be used
  to flood an inbox. BotID-checked like the other public forms.
*/

const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];
const COOLDOWN_MS = 60_000;
const LOOKUPS_PER_WINDOW = 10;
const LOOKUP_WINDOW_MS = 15 * 60_000;

const bodySchema = z.object({
  email: z.email().trim().toLowerCase(),
  from: z.string().max(200).optional(),
});

/** A link is on its way (or one went out in the last minute). */
const SENT = () => NextResponse.json({ ok: true, sent: true });
/** Not staff, and no current membership under this email. */
const NO_MEMBERSHIP = () => NextResponse.json({ ok: false, reason: "no-membership" });
/** A members record exists, but it's paused or canceled. */
const INACTIVE = () => NextResponse.json({ ok: false, reason: "inactive" });
const FAILED = () =>
  NextResponse.json({ error: "Couldn't send the link. Try again in a minute." }, { status: 500 });

const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);

export async function POST(request: Request) {
  // A bot learns nothing and mails nothing.
  if (await isBot()) return SENT();

  let parsed;
  try {
    parsed = bodySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }
  const { email } = parsed.data;
  // Only relative, single-slash paths — the same open-redirect rule as the form.
  const from = parsed.data.from && /^\/(?!\/)/.test(parsed.data.from) ? parsed.data.from : null;

  try {
    const db = getAdminDb();

    // Lookups per IP: what keeps the "no membership" answer from being a
    // membership checker. Counted before the lookup, hits and misses alike.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const lookups = db.collection(COLLECTIONS.authThrottle).doc(`ip-${hash(ip)}`);
    const allowed = await db.runTransaction(async (tx) => {
      const d = (await tx.get(lookups)).data() as { windowStart?: Timestamp; count?: number } | undefined;
      const fresh = !d?.windowStart || Date.now() - d.windowStart.toMillis() > LOOKUP_WINDOW_MS;
      const count = fresh ? 1 : (d.count ?? 0) + 1;
      tx.set(lookups, { windowStart: fresh ? Timestamp.now() : d.windowStart, count });
      return count <= LOOKUPS_PER_WINDOW;
    });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many tries. Wait a few minutes and try again." },
        { status: 429 },
      );
    }

    // One link a minute per address.
    const throttle = db.collection(COLLECTIONS.authThrottle).doc(hash(email));
    const last = (await throttle.get()).data()?.sentAt as Timestamp | undefined;
    if (last && Date.now() - last.toMillis() < COOLDOWN_MS) return SENT();

    // Eligible: staff, or a current member.
    let name = "";
    let eligible = Boolean(resolveAdminRole(email));
    if (!eligible) {
      const snap = await db
        .collection(COLLECTIONS.members)
        .where("email", "==", email)
        .where("status", "in", CURRENT)
        .limit(1)
        .get();
      if (!snap.empty) {
        eligible = true;
        name = (snap.docs[0].data() as MemberDoc).name;
      }
    }
    if (!eligible) {
      const former = await db.collection(COLLECTIONS.members).where("email", "==", email).limit(1).get();
      return former.empty ? NO_MEMBERSHIP() : INACTIVE();
    }

    const login = await ensureLogin(email, name);
    if (!login.ok) {
      console.error("[auth] couldn't provision a login for an eligible email", login.error);
      return FAILED();
    }

    const back = new URL("/sign-in", SITE_URL);
    if (from && from !== "/portal") back.searchParams.set("from", from);
    const link = await getAdminAuth().generateSignInWithEmailLink(email, {
      url: back.toString(),
      handleCodeInApp: true,
    });

    const mail = signInLinkEmail({ link });
    const sent = await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
    if (!sent) return FAILED();
    await throttle.set({ sentAt: Timestamp.now() });
    return SENT();
  } catch (error) {
    console.error("[auth] sign-in link failed", error);
    return FAILED();
  }
}
