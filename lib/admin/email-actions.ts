"use server";

import { requireAdmin } from "@/lib/auth/session";
import { CATALOG } from "@/lib/email/catalog";
import { sendSafely } from "@/lib/email/resend";

/*
  "SEND A TEST TO ME" on Settings → Emails: the sample of one automated
  email, to the signed-in admin's own address — never anyone else's, and
  never chosen in the browser. Subject marked "[Test]". On a review copy
  EMAIL_REDIRECT_TO still applies, as it does to every email.
*/
export async function sendTestEmail(key: string): Promise<{ ok: boolean; message: string }> {
  const me = await requireAdmin();
  const entry = CATALOG.find((e) => e.key === key);
  if (!entry) return { ok: false, message: "That email isn't in the list." };
  const mail = entry.build();
  const sent = await sendSafely({ to: me.email, subject: `[Test] ${mail.subject}`, html: mail.html, text: mail.text });
  return sent ? { ok: true, message: `Sent to ${me.email}.` } : { ok: false, message: "It didn't send — try again in a minute." };
}
