import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { isBot } from "@/lib/botid";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type InquiryDoc } from "@/lib/firebase/collections";
import { fieldErrors, inquirySchema, stripUndefined } from "@/lib/validation/schemas";
import { EVENTS_NOTIFY_TO, PARTNER_NOTIFY_TO, sendSafely } from "@/lib/email/resend";
import { inquiryReceivedEmail, inquiryStaffEmail } from "@/lib/email/inquiry-templates";
import { IS_PREVIEW } from "@/lib/preview";

/*
  EVENT REQUESTS AND STUDIO PARTNER INQUIRIES — /api/apply's shape, for
  lib/inquiries.ts. BotID first (and listed in instrumentation-client.ts's
  `protect`, or production flags every real visitor as a bot), the honeypot,
  zod, a double-submit guard, the save, then the emails: "we have it" to
  the requester and a notice to staff. Email is best-effort — the request is
  saved either way.
*/

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  if (await isBot()) return NextResponse.json({ error: "Access denied." }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  // Honeypot: answer 200 so a bot learns nothing.
  if (typeof body === "object" && body !== null && (body as { company_url?: unknown }).company_url) {
    return NextResponse.json({ ok: true });
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;
  if (IS_PREVIEW) return NextResponse.json({ ok: true, preview: true });

  try {
    // The same person sending the same kind twice in a few minutes is a
    // double click, not a second request. One equality filter: no index.
    const since = Date.now() - DUPLICATE_WINDOW_MS;
    const earlier = await getAdminDb().collection(COLLECTIONS.inquiries).where("email", "==", input.email).get();
    if (earlier.docs.some((d) => (d.data() as InquiryDoc).kind === input.kind && (d.data() as InquiryDoc).createdAt.toMillis() >= since)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const doc = stripUndefined<Partial<InquiryDoc>>({ ...input, status: "new", decisions: [], createdAt: Timestamp.now() });
    const ref = await getAdminDb().collection(COLLECTIONS.inquiries).add(doc);

    const received = inquiryReceivedEmail(input.kind, input);
    const staff = inquiryStaffEmail(input.kind, ref.id, input);
    const notify = input.kind === "event" ? EVENTS_NOTIFY_TO : PARTNER_NOTIFY_TO;
    await Promise.all([
      sendSafely({ to: input.email, subject: received.subject, html: received.html, text: received.text }),
      notify.length
        ? sendSafely({ to: notify, subject: staff.subject, html: staff.html, text: staff.text, replyTo: input.email })
        : Promise.resolve(false),
    ]);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("[inquiries] failed", error);
    return NextResponse.json({ error: "We couldn't send that. Please try again." }, { status: 500 });
  }
}
