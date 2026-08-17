/**
 * Transactional email in Geekdom's voice — short sentences, active verbs, one
 * idea per paragraph. The letter to members is the register to match.
 *
 * Inline styles only: email clients strip <style> blocks and never load web
 * fonts. This module is PURE (no server-only imports) so the same functions can
 * render a preview in the browser.
 */

import { SITE_URL, CONTACT_EMAIL, LOCATION } from "@/lib/site";
import { firstName } from "@/lib/format";

// Geekdom brand, hardcoded — email can't read CSS custom properties.
const RUST = "#CA3625";
const INK = "#1D1D1D";
const MUTED = "#6B6560";
const SAND = "#FAF8F5";
const BORDER = "#E6DFD7";

// ─── Chrome ─────────────────────────────────────────────────────────────────

function shell(content: string): string {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${SAND};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Building San Antonio, one startup at a time.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
        <tr><td style="background:${INK};padding:22px 32px;">
          <span style="font-family:Helvetica,Arial,sans-serif;font-size:19px;font-weight:700;color:#ffffff;letter-spacing:-0.01em;">Geekdom</span>
        </td></tr>
        <tr><td style="padding:32px;font-family:Helvetica,Arial,sans-serif;color:${INK};font-size:16px;line-height:1.6;">
          ${content}
        </td></tr>
        <tr><td style="background:${SAND};border-top:1px solid ${BORDER};padding:20px 32px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
          <div style="font-weight:600;color:${INK};">Building San Antonio, one startup at a time.</div>
          <div style="margin-top:6px;">${LOCATION.floor} · ${LOCATION.full}</div>
          <div style="margin-top:6px;"><a href="mailto:${CONTACT_EMAIL}" style="color:${MUTED};">${CONTACT_EMAIL}</a></div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 18px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${INK};">${text}</h1>`;
}

function paragraphs(body: string): string {
  return body
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin:0 0 16px;color:${INK};font-size:16px;line-height:1.6;">${p}</p>`,
    )
    .join("");
}

function button(href: string, label: string): string {
  // Table-wrapped rather than a bare padded <a> — Outlook ignores padding on
  // inline elements and would render this as plain underlined text.
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${RUST};border-radius:8px;">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

function note(text: string): string {
  return `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${BORDER};font-size:13px;line-height:1.6;color:${MUTED};">${text}</p>`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;font-size:13px;color:${MUTED};white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:14px;color:${INK};vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

/**
 * Applicant-supplied text lands in the team notification, so it has to be
 * escaped — otherwise a `<script>` or a stray `<` in someone's pitch mangles
 * the email, and the notification goes to Geekdom staff.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Templates ──────────────────────────────────────────────────────────────

export interface ApplicantVars {
  name: string;
  email: string;
}

/** 1. Confirmation to the applicant. */
export function applicationReceivedEmail(vars: ApplicantVars): {
  subject: string;
  html: string;
} {
  return {
    subject: "We got your application.",
    html: shell(
      heading("We got it.") +
        paragraphs(
          [
            `Thanks, ${firstName(vars.name)}.`,
            "Your application to the Geekdom club is in. We read every one — a real person, not a filter.",
            "You'll hear back from us once we've had a look. If it's a fit, we'll send you an invitation and the link to activate your membership.",
          ].join("\n\n"),
        ) +
        note(
          `Applied by mistake, or need to change something? Just reply to this email.`,
        ),
    ),
  };
}

export interface TeamNotifyVars {
  name: string;
  email: string;
  company?: string;
  audience: string;
  stage: string;
  building: string;
  needs: string;
  formerMember: boolean;
  adminUrl: string;
}

/** 2. Notification to the Geekdom team. */
export function teamNotifyEmail(vars: TeamNotifyVars): {
  subject: string;
  html: string;
} {
  const rows = [
    detailRow("Name", vars.name),
    detailRow("Email", vars.email),
    vars.company ? detailRow("Company", vars.company) : "",
    detailRow("They are", vars.audience),
    detailRow("Stage", vars.stage),
    vars.formerMember ? detailRow("Former member", "Yes — coworking era") : "",
  ].join("");

  return {
    subject: `New application — ${vars.name}${vars.company ? ` (${vars.company})` : ""}`,
    html: shell(
      heading("New application") +
        `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">${rows}</table>` +
        `<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;">Building</p>` +
        `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(vars.building)}</p>` +
        `<p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;">What they need</p>` +
        `<p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(vars.needs)}</p>` +
        button(vars.adminUrl, "Review in the portal"),
    ),
  };
}

export interface InviteVars {
  name: string;
  checkoutUrl: string;
  priceLabel: string | null;
}

/** 3. Approved — here's your checkout link. */
export function inviteEmail(vars: InviteVars): {
  subject: string;
  html: string;
} {
  const priceLine = vars.priceLabel
    ? `Membership is ${vars.priceLabel}, and you can cancel from your account any time.`
    : "You'll see the membership price on the next screen before anything is charged.";

  return {
    subject: "You're in. Come build with us.",
    html: shell(
      heading("You're in.") +
        paragraphs(
          [
            `Welcome, ${firstName(vars.name)}.`,
            "We read your application and we want you in the room. The third floor is the home of the club — meetups, build sessions, office hours with mentors, fireside chats, pitch nights, and the people who make all of it worth showing up for.",
            "One step left: activate your membership.",
          ].join("\n\n"),
        ) +
        button(vars.checkoutUrl, "Activate membership") +
        paragraphs([priceLine].join("\n\n")) +
        note(
          "This link is yours — please don't forward it. If it expires before you get to it, reply and we'll send a fresh one.",
        ),
    ),
  };
}

export interface DecisionVars {
  name: string;
  waitlisted: boolean;
}

/** 4. Not right now — declined or waitlisted. */
export function decisionEmail(vars: DecisionVars): {
  subject: string;
  html: string;
} {
  const body = vars.waitlisted
    ? [
        `Thanks for applying, ${firstName(vars.name)}.`,
        "We'd like to have you in the room, and right now we're managing how fast the club grows so the room stays what it's meant to be. You're on the list, and we'll come back to you as space opens.",
        "In the meantime, our public events are open. Come by, meet people, see how it feels.",
      ]
    : [
        `Thanks for applying, ${firstName(vars.name)}.`,
        "We're not able to offer you a membership right now. That's a call about timing and fit, not about you or what you're building.",
        "Our public events stay open — come to one, meet the community, and apply again when things have moved. We'd genuinely like to see it.",
      ];

  return {
    subject: vars.waitlisted
      ? "You're on the list."
      : "About your application.",
    html: shell(
      heading(vars.waitlisted ? "You're on the list." : "Not this round.") +
        paragraphs(body.join("\n\n")) +
        button(`${SITE_URL}/events`, "See what's coming up"),
    ),
  };
}

/** 5. Payment confirmed — you're a member. */
export function welcomeEmail(vars: { name: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "Welcome to Geekdom.",
    html: shell(
      heading("Welcome to Geekdom.") +
        paragraphs(
          [
            `You're a member, ${firstName(vars.name)}.`,
            `Come find us on the ${LOCATION.floor.toLowerCase()} at ${LOCATION.street}. Drop-in workspace when you need to focus, a cafe for your coffee chats, and meeting rooms you can reserve for the conversations that need a door.`,
            "The calendar is where the club actually happens. Start there.",
          ].join("\n\n"),
        ) +
        button(`${SITE_URL}/events`, "See what's on") +
        note(
          `Manage your membership or update your card any time at <a href="${SITE_URL}/account" style="color:${RUST};">${SITE_URL.replace(/^https?:\/\//, "")}/account</a>.`,
        ),
    ),
  };
}

/** 6. Billing portal link, requested from /account. */
export function portalLinkEmail(vars: { portalUrl: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "Your Geekdom billing link",
    html: shell(
      heading("Manage your membership") +
        paragraphs(
          [
            "Here's your secure link to update your card, download invoices, or cancel your membership.",
          ].join("\n\n"),
        ) +
        button(vars.portalUrl, "Open billing") +
        note(
          "This link expires shortly and works once. Didn't ask for it? You can ignore this email — nothing has changed on your account.",
        ),
    ),
  };
}
