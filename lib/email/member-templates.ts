/**
 * MEMBER EMAILS — the account and billing mail a Geekdom member receives,
 * in the site's brand (the older templates in ./templates.ts predate it:
 * white card, rounded corners, a red button).
 *
 * The brand, as far as email allows:
 *   · Bone ground, a Bone Light card, a Graphite hairline. Square corners.
 *   · The real wordmark (a PNG — email can't use the SVG mask) in Geekdom Red,
 *     the one place Red appears. Buttons are GRAPHITE: Red is reserved for
 *     the logo and Apply, on the site and here.
 *   · Rubik where the client loads it (Apple Mail, iOS); Helvetica/Arial
 *     everywhere else. IBM Plex Mono labels fall back to Menlo/Consolas.
 *   · Inline styles and tables only — email clients strip <style> and break
 *     on flexbox.
 *
 * PURE (no server-only imports): the same functions render previews.
 *
 * Voice: short declaratives, one idea per paragraph, no "we're thrilled".
 * Billing mail says what happened, what it means, and the one thing to do.
 */

import { SITE_URL, CONTACT_EMAIL, LOCATION, LUMA_CALENDAR_URL } from "@/lib/site";
import { escapeHtml } from "@/lib/email/templates";
import { priceLabel } from "@/lib/membership";

const BONE = "#F4F1EB";
const BONE_LIGHT = "#FAF8F3";
const GRAPHITE = "#1B1B1B";
const CONCRETE = "#6B6B6B";
const CLAY = "#C8623D";
const RULE = "#DDD6CA";

const SANS = "Rubik, Helvetica, Arial, sans-serif";
const MONO = "'IBM Plex Mono', Menlo, Consolas, monospace";

/**
 * Where links and the logo point. A local SITE_URL (localhost) can't be
 * opened from someone's inbox, so it falls back to the public review URL.
 */
export const EMAIL_ORIGIN = /localhost|127\.0\.0\.1/.test(SITE_URL)
  ? "https://next-geekdom.vercel.app"
  : SITE_URL.replace(/\/$/, "");

const url = (path: string) => `${EMAIL_ORIGIN}${path}`;

export interface Email {
  subject: string;
  /** The inbox preview line. */
  preheader: string;
  html: string;
  /** Plain-text alternative — some clients and every spam filter read it. */
  text: string;
}

// ─── Building blocks ────────────────────────────────────────────────────────

function layout(preheader: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&family=IBM+Plex+Mono&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${BONE};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BONE};">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BONE};padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td style="padding:0 0 24px;">
          <a href="${url("/portal")}" style="text-decoration:none;">
            <img src="${url("/brand/kit/geekdom-wordmark-red.png")}" width="120" height="45" alt="Geekdom" style="display:block;border:0;width:120px;height:auto;">
          </a>
        </td></tr>
        <tr><td style="background:${BONE_LIGHT};border:1px solid ${RULE};padding:36px 32px;font-family:${SANS};color:${GRAPHITE};font-size:16px;line-height:1.6;">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 4px 0;font-family:${SANS};font-size:13px;line-height:1.7;color:${CONCRETE};">
          ${LOCATION.building}, ${LOCATION.floorShort} · ${LOCATION.street}, ${LOCATION.city}, ${LOCATION.state} ${LOCATION.zip}<br>
          Questions? <a href="mailto:${CONTACT_EMAIL}" style="color:${GRAPHITE};text-decoration:underline;text-decoration-color:${CLAY};">${CONTACT_EMAIL}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function eyebrow(text: string): string {
  return `<p style="margin:0 0 14px;font-family:${MONO};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${CONCRETE};">${text}</p>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 20px;font-family:${SANS};font-size:28px;line-height:1.2;font-weight:500;letter-spacing:-0.02em;color:${GRAPHITE};">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${GRAPHITE};">${text}</p>`;
}

function muted(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:14px;line-height:1.6;color:${CONCRETE};">${text}</p>`;
}

/** A square Graphite button — table-wrapped so Outlook keeps the padding. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr><td style="background:${GRAPHITE};">
      <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:16px;font-weight:500;color:${BONE};text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

/** A key/value block — receipts, end dates. */
function details(rows: [string, string][]): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border-top:1px solid ${RULE};">
    ${rows
      .map(
        ([k, v]) => `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${RULE};font-family:${MONO};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${CONCRETE};">${k}</td>
      <td align="right" style="padding:11px 0;border-bottom:1px solid ${RULE};font-family:${SANS};font-size:15px;color:${GRAPHITE};">${escapeHtml(v)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}

function rule(): string {
  return `<div style="margin:28px 0 20px;border-top:1px solid ${RULE};"></div>`;
}

function first(name: string): string {
  return escapeHtml(name.trim().split(/\s+/)[0] || "there");
}

function email(subject: string, preheader: string, body: string, text: string): Email {
  return { subject, preheader, html: layout(preheader, body), text: `${text}\n\n—\nGeekdom · ${LOCATION.street}, ${LOCATION.city}\n${CONTACT_EMAIL}` };
}

// ─── Access ─────────────────────────────────────────────────────────────────

/** Every sign-in. Replaces Firebase's default sender. */
export function signInLinkEmail(v: { link: string }): Email {
  return email(
    "Your Geekdom sign-in link",
    "Open it on this device to sign in. It works once, for about an hour.",
    eyebrow("Member portal") +
      h1("Here's your sign-in link.") +
      p("Open it on the device where you asked for it, and you're in.") +
      button(v.link, "Sign in to Geekdom") +
      muted("It works once, for about an hour. Didn't ask for it? Ignore this email — nothing changes on your account."),
    `Sign in to Geekdom: ${v.link}\n\nIt works once, for about an hour. Didn't ask for it? Ignore this email.`,
  );
}

/** An admin added them, or the CSV import ran. */
export function portalInviteEmail(v: { name: string }): Email {
  const signIn = url("/sign-in");
  return email(
    "Your Geekdom member portal is ready",
    "Your membership now has a home online — the directory, this month's events, and your billing.",
    eyebrow("Member portal") +
      h1(`${first(v.name)}, your member portal is ready.`) +
      p("Your Geekdom membership now has a home online: the member directory, what's on this month, and your profile and billing in one place.") +
      p("No password to set up. Sign in with this email address and we'll send you a link.") +
      button(signIn, "Open the member portal") +
      rule() +
      muted("First thing to do: fill in your directory profile, so the members you haven't met yet know what to ask you about."),
    `${first(v.name)}, your member portal is ready.\n\nSign in with this email address — no password needed: ${signIn}`,
  );
}

/** Sent to BOTH the old and new address when the sign-in email changes. */
export function emailChangedEmail(v: { name: string; oldEmail: string; newEmail: string }): Email {
  return email(
    "Your Geekdom sign-in email changed",
    `You'll now sign in with ${v.newEmail}.`,
    eyebrow("Account") +
      h1("Your sign-in email changed.") +
      p(`Hi ${first(v.name)}. Your Geekdom account now signs in with <strong style="font-weight:500;">${escapeHtml(v.newEmail)}</strong> instead of ${escapeHtml(v.oldEmail)}.`) +
      muted(`Didn't make this change? Email <a href="mailto:${CONTACT_EMAIL}" style="color:${GRAPHITE};">${CONTACT_EMAIL}</a> right away.`),
    `Your Geekdom account now signs in with ${v.newEmail} instead of ${v.oldEmail}. Didn't make this change? Email ${CONTACT_EMAIL}.`,
  );
}

// ─── Joining ────────────────────────────────────────────────────────────────

/** They became a member. Points them into the portal. */
export function memberWelcomeEmail(v: { name: string }): Email {
  return email(
    "Welcome to Geekdom.",
    "You're a member. Here's where to start.",
    eyebrow("Geekdom Club") +
      h1(`Welcome, ${first(v.name)}.`) +
      p(`You're a member. The clubhouse is on the third floor of ${LOCATION.building}, open to you around the clock.`) +
      p("Three things to do this week:") +
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
        ${[
          ["Fill in your profile", "So members know what to ask you about."],
          ["Find your people", "The directory shows who's building what."],
          ["Come to something", "This month's events are on your dashboard."],
        ]
          .map(
            ([t, d], i) => `<tr>
          <td valign="top" style="padding:8px 14px 8px 0;font-family:${MONO};font-size:12px;color:${CONCRETE};">0${i + 1}</td>
          <td style="padding:8px 0;font-family:${SANS};font-size:15px;line-height:1.5;color:${GRAPHITE};"><span style="font-weight:500;">${t}.</span> <span style="color:${CONCRETE};">${d}</span></td>
        </tr>`,
          )
          .join("")}
      </table>` +
      button(url("/portal"), "Open the member portal") +
      muted(`Or go straight to <a href="${LUMA_CALENDAR_URL}" style="color:${GRAPHITE};">this month's calendar</a>.`),
    `Welcome to Geekdom, ${first(v.name)}.\n\n1. Fill in your profile.\n2. Find your people in the directory.\n3. Come to something this month.\n\nMember portal: ${url("/portal")}`,
  );
}

// ─── Billing ────────────────────────────────────────────────────────────────

const BILLING = url("/portal/profile#billing");

export function receiptEmail(v: { name: string; amount: string; date: string; card: string; invoiceNumber: string }): Email {
  return email(
    `Your Geekdom receipt — ${v.amount}`,
    `Paid ${v.amount} for your Club membership on ${v.date}.`,
    eyebrow("Receipt") +
      h1(`Thanks, ${first(v.name)}. You're paid up.`) +
      details([
        ["Club membership", v.amount],
        ["Paid", v.date],
        ["Card", v.card],
        ["Invoice", v.invoiceNumber],
      ]) +
      button(BILLING, "View invoices and receipts") +
      muted("Your PDF receipt is in the member portal, under Manage billing."),
    `Paid ${v.amount} for your Geekdom Club membership on ${v.date} (${v.card}). Invoice ${v.invoiceNumber}. Receipts: ${BILLING}`,
  );
}

export function paymentFailedEmail(v: { name: string; amount: string; card: string }): Email {
  return email(
    "Your Geekdom payment didn't go through",
    `${v.card} was declined for ${v.amount}. Update it in a minute — your access continues meanwhile.`,
    eyebrow("Billing") +
      h1("Your payment didn't go through.") +
      p(`Hi ${first(v.name)}. We tried to charge ${escapeHtml(v.card)} for your ${v.amount} membership, and it was declined.`) +
      p("Your access continues while you sort it out. Updating your card takes a minute, and we'll retry the payment as soon as you save it.") +
      button(BILLING, "Update your card") +
      muted("Cards usually fail because they expired or were replaced. If something else is going on, reply to this email."),
    `Your ${v.amount} Geekdom payment on ${v.card} was declined. Your access continues. Update your card: ${BILLING}`,
  );
}

export function cardExpiringEmail(v: { name: string; card: string; exp: string }): Email {
  return email(
    "Your card on file expires soon",
    `${v.card} expires ${v.exp}. Update it so your membership doesn't skip a beat.`,
    eyebrow("Billing") +
      h1("Your card expires soon.") +
      p(`Hi ${first(v.name)}. ${escapeHtml(v.card)} expires at the end of ${escapeHtml(v.exp)}. Update it now so your next payment goes through without a hitch.`) +
      button(BILLING, "Update your card"),
    `${v.card} expires ${v.exp}. Update your card: ${BILLING}`,
  );
}

export function cancellationConfirmedEmail(v: { name: string; endDate: string }): Email {
  return email(
    "Your Geekdom membership is set to end",
    `You keep full access until ${v.endDate}. Changed your mind? It takes one click.`,
    eyebrow("Membership") +
      h1("We're sorry to see you go.") +
      p(`Hi ${first(v.name)}. Your membership is canceled and won't renew.`) +
      details([
        ["Access until", v.endDate],
        ["Further charges", "None"],
      ]) +
      p("Changed your mind? You can keep your membership any time before then.") +
      button(BILLING, "Keep my membership"),
    `Your Geekdom membership won't renew. Access until ${v.endDate}. Keep it: ${BILLING}`,
  );
}

export function membershipEndedEmail(v: { name: string }): Email {
  return email(
    "Your Geekdom membership has ended",
    "Thanks for being part of the room. The door's open whenever you want back in.",
    eyebrow("Membership") +
      h1(`Thanks for being part of the room, ${first(v.name)}.`) +
      p("Your membership has ended, and your portal access with it. Nothing else is owed.") +
      p("Whatever you're building next, the door's open. Come back any time.") +
      button(url("/apply"), "Rejoin Geekdom") +
      muted(`Public events are still on <a href="${LUMA_CALENDAR_URL}" style="color:${GRAPHITE};">the calendar</a> — come say hello.`),
    `Your Geekdom membership has ended. Come back any time: ${url("/apply")}`,
  );
}

export function welcomeBackEmail(v: { name: string; nextPayment: string }): Email {
  return email(
    "Your Geekdom membership continues",
    "Cancellation undone. Nothing else changes.",
    eyebrow("Membership") +
      h1(`Glad you're staying, ${first(v.name)}.`) +
      p("Your cancellation is undone, and your membership continues as before.") +
      details([["Next payment", v.nextPayment]]) +
      button(url("/portal"), "Open the member portal"),
    `Your Geekdom membership continues. Next payment ${v.nextPayment}.`,
  );
}

/** Every member email, with sample data — for previews (scripts and the admin). */
export function samples(): { key: string; mail: Email }[] {
  const name = "Jesse Hernandez";
  // From the price constant, never typed — it would drift from Stripe.
  const amount = priceLabel()?.split("/")[0] ?? "";
  return [
    { key: "sign-in-link", mail: signInLinkEmail({ link: url("/sign-in") }) },
    { key: "portal-invite", mail: portalInviteEmail({ name }) },
    { key: "email-changed", mail: emailChangedEmail({ name, oldEmail: "jesse@oldmail.com", newEmail: "jesseovr@gmail.com" }) },
    { key: "welcome", mail: memberWelcomeEmail({ name }) },
    { key: "receipt", mail: receiptEmail({ name, amount, date: "October 23, 2026", card: "Visa •••• 4242", invoiceNumber: "GKDM-0006" }) },
    { key: "payment-failed", mail: paymentFailedEmail({ name, amount, card: "Visa •••• 4242" }) },
    { key: "card-expiring", mail: cardExpiringEmail({ name, card: "Visa •••• 4242", exp: "November 2026" }) },
    { key: "cancellation-confirmed", mail: cancellationConfirmedEmail({ name, endDate: "November 22, 2026" }) },
    { key: "membership-ended", mail: membershipEndedEmail({ name }) },
    { key: "welcome-back", mail: welcomeBackEmail({ name, nextPayment: "November 22, 2026" }) },
  ];
}
