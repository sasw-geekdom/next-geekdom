import { NextResponse } from "next/server";
import { isBot } from "@/lib/botid";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type ApplicationDoc } from "@/lib/firebase/collections";
import {
  applicationSchema,
  fieldErrors,
  stripUndefined,
} from "@/lib/validation/schemas";
import { sendSafely, TEAM_NOTIFY_TO } from "@/lib/email/resend";
import {
  applicationReceivedEmail,
  teamNotifyEmail,
} from "@/lib/email/templates";
import { SITE_URL } from "@/lib/site";
import { IS_PREVIEW } from "@/lib/preview";

/** Window in which a repeat submission from the same email is treated as a dupe. */
const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  // BotID gate, before anything touches Firestore or Resend.
  //
  // Note this is bypassed under `next dev` — `checkBotId()` needs the Vercel
  // runtime, so it always reports "not a bot" locally. That's what keeps the
  // form usable in development; it also means a local pass proves nothing about
  // the deployed behaviour.
  if (await isBot()) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  // Honeypot. Real people never fill this in because it's hidden; naive bots
  // fill every field they find. Answer 200 rather than 400 — telling a bot it
  // failed is what lets it learn to stop falling for the trap.
  if (
    typeof body === "object" &&
    body !== null &&
    "company_url" in body &&
    (body as { company_url?: unknown }).company_url
  ) {
    return NextResponse.json({ ok: true });
  }

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Preview deploys have no Firestore and no Resend. Answer as though the
  // application landed, so the success state and the /apply/thanks handoff can
  // be reviewed — but only AFTER validation above, so the error states stay
  // reachable too. A form that always succeeds proves nothing about the form.
  if (IS_PREVIEW) {
    console.info("[apply] preview mode — not saved", { email: input.email });
    return NextResponse.json({ ok: true, preview: true });
  }

  try {
    // Guard against double submissions — a slow network and an impatient
    // second click would otherwise put the same person in the queue twice, and
    // staff would read the same application twice.
    const since = Timestamp.fromMillis(Date.now() - DUPLICATE_WINDOW_MS);
    const existing = await getAdminDb()
      .collection(COLLECTIONS.applications)
      .where("email", "==", input.email)
      .where("createdAt", ">=", since)
      .limit(1)
      .get();

    if (!existing.empty) {
      // Deliberately a success: from the applicant's point of view their
      // application is in, which is true. Re-sending the confirmation would
      // just double the mail.
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const doc = stripUndefined<Partial<ApplicationDoc>>({
      ...input,
      status: "new",
      reviewedBy: null,
      reviewedAt: null,
      invitedAt: null,
      createdAt: Timestamp.now(),
    });

    const ref = await getAdminDb().collection(COLLECTIONS.applications).add(doc);

    // Email is best-effort — `sendSafely` never throws. The application is
    // already saved, and a mail outage must not make the applicant think the
    // submission failed and try again.
    const confirmation = applicationReceivedEmail({
      name: input.name,
      email: input.email,
    });
    const notify = teamNotifyEmail({
      name: input.name,
      email: input.email,
      company: input.company,
      audience: input.audience,
      stage: input.stage,
      building: input.building,
      needs: input.needs,
      formerMember: input.formerMember,
      adminUrl: `${SITE_URL}/admin/applications/${ref.id}`,
    });

    await Promise.all([
      sendSafely({
        to: input.email,
        subject: confirmation.subject,
        html: confirmation.html,
      }),
      TEAM_NOTIFY_TO.length
        ? sendSafely({
            to: TEAM_NOTIFY_TO,
            subject: notify.subject,
            html: notify.html,
            // Replying to the notification reaches the applicant directly,
            // which is what staff instinctively try to do.
            replyTo: input.email,
          })
        : Promise.resolve(false),
    ]);

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("[apply] failed", error);
    return NextResponse.json(
      { error: "We couldn't save your application. Please try again." },
      { status: 500 },
    );
  }
}
