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
  by hand. Anyone else gets NOTHING, and the same response: the form never
  reveals who has an account, and can't be used to mail strangers.

  Throttled per address (one link a minute) so the button can't be used to
  flood an inbox. BotID-checked like the other public forms.
*/

const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];
const COOLDOWN_MS = 60_000;

const bodySchema = z.object({
  email: z.email().trim().toLowerCase(),
  from: z.string().max(200).optional(),
});

/** Same answer whether or not anything was sent. */
const OK = () => NextResponse.json({ ok: true });

export async function POST(request: Request) {
  if (await isBot()) return OK();

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

    // One link a minute per address.
    const throttle = db
      .collection(COLLECTIONS.authThrottle)
      .doc(createHash("sha256").update(email).digest("hex").slice(0, 32));
    const last = (await throttle.get()).data()?.sentAt as Timestamp | undefined;
    if (last && Date.now() - last.toMillis() < COOLDOWN_MS) return OK();

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
    if (!eligible) return OK();

    const login = await ensureLogin(email, name);
    if (!login.ok) {
      console.error("[auth] couldn't provision a login for an eligible email", login.error);
      return OK();
    }

    const back = new URL("/sign-in", SITE_URL);
    if (from && from !== "/portal") back.searchParams.set("from", from);
    const link = await getAdminAuth().generateSignInWithEmailLink(email, {
      url: back.toString(),
      handleCodeInApp: true,
    });

    const mail = signInLinkEmail({ link });
    const sent = await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
    if (sent) await throttle.set({ sentAt: Timestamp.now() });
  } catch (error) {
    // Logged, not surfaced — an error here would leak the same signal the
    // uniform response exists to hide.
    console.error("[auth] sign-in link failed", error);
  }
  return OK();
}
