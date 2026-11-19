import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { env } from "@/lib/env";
import { compDate } from "@/lib/perks";
import { getBilling } from "@/lib/stripe/billing";
import { sendSafely } from "@/lib/email/resend";
import { compEndingEmail } from "@/lib/email/member-templates";

/*
  THE COMPLIMENTARY-ENDING REMINDER — a daily scheduled job (vercel.json
  `crons`, 9 AM Central). Finds every member whose complimentary period
  (a perk tag — lib/perks.ts) ends in the next 30 days and who hasn't been
  reminded, and emails them once (`comp.remindedAt`):
    · they pay through Stripe (billing was paused) → "your billing resumes
      on <date>, $100/month on Visa •••• 4242"
    · nothing set up → "add a card to keep your membership"

  Vercel calls it with `Authorization: Bearer $CRON_SECRET`. Without the
  secret set, it refuses — fails closed, so nobody can trigger mail.
  One range query on `comp.until` (an ISO string), no composite index.
*/

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = env(process.env.CRON_SECRET);
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86_400_000);
  const snap = await getAdminDb()
    .collection(COLLECTIONS.members)
    .where("comp.until", ">", now.toISOString())
    .where("comp.until", "<=", in30.toISOString())
    .get();

  let sent = 0;
  let skipped = 0;
  for (const doc of snap.docs) {
    const m = doc.data() as MemberDoc;
    const c = m.comp;
    if (!c?.until || c.remindedAt || !m.email || !["active", "trialing", "past_due"].includes(m.status)) {
      skipped++;
      continue;
    }
    const billing = c.paused ? await getBilling(m).catch(() => null) : null;
    const resumes = billing?.card && billing.amount ? { amount: billing.amount, card: `${billing.card.brand} •••• ${billing.card.last4}` } : null;
    const mail = compEndingEmail({ name: m.name, label: c.label, endDate: compDate(c.until), resumes });
    const ok = await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text });
    if (ok) {
      await doc.ref.set({ comp: { remindedAt: now.toISOString() } }, { merge: true });
      sent++;
    }
  }
  return NextResponse.json({ checked: snap.size, sent, skipped });
}
