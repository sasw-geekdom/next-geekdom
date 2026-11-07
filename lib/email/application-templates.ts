/**
 * THE APPLICATION WORKFLOW'S EMAILS — every message the two-step review
 * sends, in the member emails' brand (./member-templates.ts: Bone, square
 * corners, the red wordmark, Graphite buttons).
 *
 *   applicant  received → (declined | approved [+ payment link])
 *   staff      new application → ready for team review
 *
 * Voice: short declaratives, no "we're thrilled", and a decline that is
 * kind without being vague. Never the generosity line in a decline — said
 * to someone being turned away it reads as a verdict on them.
 *
 * PURE (no server-only imports), like the templates it builds on.
 */

import { LUMA_CALENDAR_URL } from "@/lib/site";
import { escapeHtml } from "@/lib/email/templates";
import { planOf, planPrice, type PlanId } from "@/lib/membership";
import { button, details, email, eyebrow, first, h1, muted, p, rule, url, type Email } from "@/lib/email/member-templates";

const plainPlan = (id: PlanId | undefined) => {
  const plan = planOf(id);
  return `${plan.name} — ${planPrice(plan).replace("’", "'")}`;
};

// ─── To the applicant ───────────────────────────────────────────────────────

/** The moment they submit. */
export function applicationReceivedEmail(v: { name: string; plan?: PlanId }): Email {
  return email(
    "We have your Geekdom application",
    "A person on the Geekdom team reads every application. We respond within two weeks.",
    eyebrow("Geekdom Club · Application") +
      h1(`Thanks, ${first(v.name)}. We have your application.`) +
      p("A person on the Geekdom team reads every application. We respond within two weeks, either way.") +
      details([["Membership", plainPlan(v.plan)]]) +
      muted(`While you wait, come to something — most of what happens on the floor is on <a href="${LUMA_CALENDAR_URL}" style="color:inherit;">our calendar</a>, and a lot of it is open.`),
    `Thanks, ${v.name.split(" ")[0]}. We have your application.\n\nA person on the Geekdom team reads every application. We respond within two weeks, either way.\n\nMembership: ${plainPlan(v.plan)}`,
  );
}

/** Declined at either step. Kind, specific about what happens next, never a verdict. */
export function applicationDeclinedEmail(v: { name: string }): Email {
  return email(
    "Your Geekdom application",
    "We've read your application and can't offer a membership right now.",
    eyebrow("Geekdom Club · Application") +
      h1(`${first(v.name)}, thank you for applying.`) +
      p("We've read your application, and we're not able to offer you a membership right now.") +
      p("That isn't a judgment of you or what you're building. The Club is small on purpose, and the timing and the mix of people in the room matter as much as anything on the form.") +
      p(`Plenty of what happens at Geekdom is open to everyone. You're welcome at our public events — they're on <a href="${LUMA_CALENDAR_URL}" style="color:inherit;">the calendar</a>.`) +
      muted("You're welcome to apply again later. If something has changed, tell us in the new application."),
    `${v.name.split(" ")[0]}, thank you for applying.\n\nWe've read your application, and we're not able to offer you a membership right now. That isn't a judgment of you or what you're building.\n\nOur public events are on the calendar: ${LUMA_CALENDAR_URL}\n\nYou're welcome to apply again later.`,
  );
}

/**
 * The team said yes.
 *   · Solo / Team with a checkout link: pay, then sign in and fill in the profile.
 *   · Solo / Team without one (Stripe not connected yet): the link follows.
 *   · Enterprise: they're a member already (terms are agreed off the site),
 *     so straight to the portal.
 */
export function applicationApprovedEmail(v: { name: string; plan?: PlanId; checkoutUrl: string | null }): Email {
  const plan = planOf(v.plan);
  const signIn = url("/sign-in");
  const head = eyebrow("Geekdom Club · Welcome") + h1(`${first(v.name)}, you're in.`) + p("The Geekdom team has read your application, and the answer is yes. Congratulations.");

  if (plan.id === "enterprise") {
    return email(
      "You're in: welcome to Geekdom",
      "Your application was approved. Sign in to the member portal and fill in your profile.",
      head +
        p("Your membership is ready. We'll be in touch about the terms of your Enterprise plan.") +
        p("Start by signing in to the member portal with this email address — no password — and filling in your profile, so members know who you are and what to ask you about.") +
        button(signIn, "Sign in to the member portal"),
      `${v.name.split(" ")[0]}, you're in.\n\nYour membership is ready; we'll be in touch about the terms of your Enterprise plan.\n\nSign in with this email address and fill in your profile: ${signIn}`,
    );
  }

  const pay = v.checkoutUrl
    ? p(`To start your ${escapeHtml(plan.name)} membership, set up your payment. It takes a minute.`) +
      details([["Membership", plainPlan(plan.id)]]) +
      button(v.checkoutUrl, "Start your membership")
    : p(`Your ${escapeHtml(plan.name)} membership is ready to start. We'll send your payment link in a separate email shortly.`) +
      details([["Membership", plainPlan(plan.id)]]);

  return email(
    "You're in: welcome to Geekdom",
    "Your application was approved. Start your membership, then fill in your profile.",
    head +
      pay +
      rule() +
      muted(`Once your membership starts, sign in to the member portal at <a href="${signIn}" style="color:inherit;">${signIn.replace(/^https?:\/\//, "")}</a> with this email address — no password — and fill in your profile.`),
    `${v.name.split(" ")[0]}, you're in.\n\n${
      v.checkoutUrl ? `Start your ${plan.name} membership: ${v.checkoutUrl}` : `We'll send your payment link in a separate email shortly.`
    }\n\nThen sign in with this email address and fill in your profile: ${signIn}`,
  );
}

/** Staff re-send (or first send, once Stripe is connected) of the payment link. */
export function paymentLinkEmail(v: { name: string; plan?: PlanId; checkoutUrl: string }): Email {
  const plan = planOf(v.plan);
  return email(
    "Your Geekdom membership: payment link",
    "Set up your payment to start your membership.",
    eyebrow("Geekdom Club · Membership") +
      h1(`${first(v.name)}, here's your payment link.`) +
      p(`Set up your payment to start your ${escapeHtml(plan.name)} membership.`) +
      details([["Membership", plainPlan(plan.id)]]) +
      button(v.checkoutUrl, "Start your membership") +
      muted("Then sign in to the member portal with this email address and fill in your profile."),
    `Start your ${plan.name} membership: ${v.checkoutUrl}\n\nThen sign in with this email address and fill in your profile: ${url("/sign-in")}`,
  );
}

// ─── To staff ───────────────────────────────────────────────────────────────

interface StaffVars {
  id: string;
  name: string;
  email: string;
  company?: string;
  plan?: PlanId;
  city?: string;
  /** "Which best describes you?" */
  describes: string[];
  brag?: string;
  building: string;
}

const review = (id: string) => url(`/portal/admin/applications/${id}`);
const excerpt = (s: string) => escapeHtml(s.length > 400 ? `${s.slice(0, 397)}…` : s);

/** A new application, for the initial reviewer. */
export function newApplicationEmail(v: StaffVars): Email {
  return email(
    `New application: ${v.name}`,
    `${planOf(v.plan).name} membership — ready for initial review.`,
    eyebrow("Applications · Initial review") +
      h1(`${escapeHtml(v.name)} applied.`) +
      details([
        ["Membership", plainPlan(v.plan)],
        ["Email", v.email],
        ["City", v.city || "—"],
        ["Company", v.company || "—"],
      ]) +
      (v.brag ? muted("In one sentence") + p(excerpt(v.brag)) : "") +
      (v.describes.length ? muted(`Describes themselves as: ${escapeHtml(v.describes.join(" · "))}`) : "") +
      muted("What they're building") +
      p(excerpt(v.building)) +
      button(review(v.id), "Review the application"),
    `${v.name} applied (${plainPlan(v.plan)}).\n\n${v.building}\n\nReview: ${review(v.id)}`,
  );
}

/** Passed initial review — for the team. */
export function teamReviewEmail(v: StaffVars & { by: string }): Email {
  return email(
    `Ready for team review: ${v.name}`,
    `${escapeHtml(v.by)} moved ${v.name} to team review.`,
    eyebrow("Applications · Team review") +
      h1(`${escapeHtml(v.name)} is ready for team review.`) +
      p(`${escapeHtml(v.by)} said yes at initial review. The team decides next.`) +
      details([
        ["Membership", plainPlan(v.plan)],
        ["City", v.city || "—"],
        ["Company", v.company || "—"],
      ]) +
      (v.brag ? p(excerpt(v.brag)) : "") +
      button(review(v.id), "Open the application"),
    `${v.name} is ready for team review (${v.by} said yes at initial review).\n\nOpen: ${review(v.id)}`,
  );
}
