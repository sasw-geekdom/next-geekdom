import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { getMemberByEmail } from "@/lib/admin/queries";
import { createPortalSession } from "@/lib/stripe/server";
import { portalRequestSchema } from "@/lib/validation/schemas";
import { sendSafely } from "@/lib/email/resend";
import { portalLinkEmail } from "@/lib/email/templates";

/**
 * Email a member their Stripe billing portal link.
 *
 * Members have no account in this app on purpose — the only identity they have
 * is the email attached to their Stripe customer. Mailing the link instead of
 * returning it is what makes that safe: possession of the inbox is the proof of
 * identity, so a stranger typing a member's address gets nothing.
 *
 * Which is also why this always answers the same way. Returning "no membership
 * found" for an unknown address would turn this endpoint into a membership
 * checker — anyone could test whether a given person belongs to the club.
 */
export async function POST(request: Request) {
  /*
    BotID gate. This endpoint mails a live Stripe billing link, so it's the more
    attractive of the two to automate: a script could walk a list of addresses
    to find members, or simply mail-bomb a known one.

    A bot gets the same uniform 200 as an unknown address rather than a 403.
    Answering differently here would hand back exactly the signal the uniform
    response exists to withhold — and would tell whoever is probing that they've
    been spotted.
  */
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({
      ok: true,
      message:
        "If that email has a Geekdom membership, a billing link is on its way.",
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = portalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const { email } = parsed.data;

  // The uniform response, sent whether or not anything was found.
  const ok = NextResponse.json({
    ok: true,
    message:
      "If that email has a Geekdom membership, a billing link is on its way.",
  });

  try {
    const member = await getMemberByEmail(email);
    if (!member) return ok;

    const session = await createPortalSession(member.stripeCustomerId);
    const mail = portalLinkEmail({ portalUrl: session.url });

    await sendSafely({ to: email, subject: mail.subject, html: mail.html });
  } catch (error) {
    // Logged, not surfaced — an error here would leak the same signal the
    // uniform response exists to hide.
    console.error("[billing] portal link failed", error);
  }

  return ok;
}
