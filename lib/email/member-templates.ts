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

export const url = (path: string) => `${EMAIL_ORIGIN}${path}`;

/*
  THE EMAIL LOGO LIVES ON VERCEL BLOB, a public file host (Jesse, November
  2026). It came from the sending copy's own address, and every one of them
  refused it: the review and staging URLs sit behind Vercel's login (403),
  and even geekdom.com answers an automated fetch — the kind an email
  service makes for images — with Vercel's bot challenge (403), so the logo
  arrived broken. Blob serves it to anyone (tested as Gmail's image proxy:
  200). It's a copy of public/brand/kit/geekdom-wordmark-red.png at a fixed
  path; to change it, upload the new file to the same path
  ("email/geekdom-wordmark-red.png", no random suffix).
*/
const EMAIL_LOGO = "https://mpyhf2bgba9n6thk.public.blob.vercel-storage.com/email/geekdom-wordmark-red.png";

export interface Email {
  subject: string;
  /** The inbox preview line. */
  preheader: string;
  html: string;
  /** Plain-text alternative — some clients and every spam filter read it. */
  text: string;
}

// ─── Building blocks (exported: the application emails share them) ─────────

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
            <img src="${EMAIL_LOGO}" width="120" height="45" alt="Geekdom" style="display:block;border:0;width:120px;height:auto;">
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

export function eyebrow(text: string): string {
  return `<p style="margin:0 0 14px;font-family:${MONO};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${CONCRETE};">${text}</p>`;
}

export function h1(text: string): string {
  return `<h1 style="margin:0 0 20px;font-family:${SANS};font-size:28px;line-height:1.2;font-weight:500;letter-spacing:-0.02em;color:${GRAPHITE};">${text}</h1>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${GRAPHITE};">${text}</p>`;
}

export function muted(text: string): string {
  return `<p style="margin:0 0 16px;font-family:${SANS};font-size:14px;line-height:1.6;color:${CONCRETE};">${text}</p>`;
}

/** A square Graphite button — table-wrapped so Outlook keeps the padding. */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
    <tr><td style="background:${GRAPHITE};">
      <a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:16px;font-weight:500;color:${BONE};text-decoration:none;">${label}</a>
    </td></tr>
  </table>`;
}

/** A key/value block — receipts, end dates. */
export function details(rows: [string, string][]): string {
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

export function rule(): string {
  return `<div style="margin:28px 0 20px;border-top:1px solid ${RULE};"></div>`;
}

export function first(name: string): string {
  return escapeHtml(name.trim().split(/\s+/)[0] || "there");
}

export function email(subject: string, preheader: string, body: string, text: string): Email {
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

/**
 * THE LAUNCH INVITATION — sent in waves from /portal/admin/members/invitations to
 * members who already have a login (the import made it). Says the portal is
 * open, how to get in (no password), and — because the directory is
 * opt-out — that they're listed and where to change it.
 */
export function portalInviteEmail(v: { name: string }): Email {
  const signIn = url("/sign-in");
  return email(
    "Your Geekdom member portal is open",
    "The directory, this month's events and your membership — in one place. Sign in with this email, no password.",
    eyebrow("Geekdom Club · Member portal") +
      h1(`${first(v.name)}, your member portal is open.`) +
      p("Geekdom has a new home for members: who's in the room, what's on this month, and your profile and membership — in one place.") +
      p("There's no password to set up. Sign in with this email address and we'll send you a link. A short checklist shows you around the first time.") +
      button(signIn, "Sign in to the member portal") +
      rule() +
      muted("You're listed in the member directory, with what you told us when you applied. You can change your profile — or hide yourself — any time at Profile."),
    `${first(v.name)}, your Geekdom member portal is open.\n\nSign in with this email address — no password needed: ${signIn}\n\nYou're listed in the member directory with what you told us when you applied; change it or hide yourself any time at Profile.`,
  );
}

/** Added to someone's Team or Enterprise membership. */
export function teamInviteEmail(v: { name: string; ownerName: string; company: string }): Email {
  const signIn = url("/sign-in");
  const whose = v.company ? escapeHtml(v.company) : `${escapeHtml(v.ownerName)}'s team`;
  const whosePlain = v.company || `${v.ownerName}'s team`;
  return email(
    `You're on ${whosePlain}'s Geekdom membership`,
    "You have your own member login — the clubhouse, the directory and this month's events.",
    eyebrow("Geekdom Club · Team") +
      h1(`${first(v.name)}, you're a Geekdom member.`) +
      p(`${escapeHtml(v.ownerName)} added you to ${whose}'s membership. You have your own login: the clubhouse on the third floor, the member directory and this month's events.`) +
      p("No password to set up. Sign in with this email address and we'll send you a link.") +
      button(signIn, "Sign in to the member portal") +
      rule() +
      muted("First thing to do: fill in your directory profile, so members know what to ask you about."),
    `${v.ownerName} added you to ${whosePlain}'s Geekdom membership.\n\nSign in with this email address — no password needed: ${signIn}`,
  );
}

/** Taken off a team: their access through it has ended. */
export function teamRemovedEmail(v: { name: string; company: string }): Email {
  const whose = v.company || "your team";
  return email(
    "Your Geekdom access has changed",
    `Your membership through ${whose} has ended.`,
    eyebrow("Geekdom Club · Team") +
      h1(`${first(v.name)}, your team access has ended.`) +
      p(`You've been taken off ${escapeHtml(whose)}'s Geekdom membership, so your member login no longer opens the portal.`) +
      p(`Want your own membership? <a href="${url("/apply")}" style="color:inherit;">Apply here</a> — or write to us if this looks like a mistake.`),
    `You've been taken off ${whose}'s Geekdom membership. Want your own? ${url("/apply")}`,
  );
}

/*
  TEAMMATES, WHEN THE TEAM'S MEMBERSHIP CHANGES (lib/team-notify.ts). They
  name the TEAM, never the owner's billing: a teammate shouldn't learn
  from Geekdom that a colleague's card failed or that they chose to leave.
  No email while the owner is merely past due — teammates keep access.
  `team` is the company, else "<owner>'s team".
*/

/** The owner cancelled at the end of the paid period. */
export function teammateEndingEmail(v: { name: string; team: string; endDate: string }): Email {
  return email(
    `Your Geekdom access ends ${v.endDate}`,
    `${v.team}'s team membership won't renew. Nothing changes until ${v.endDate}.`,
    eyebrow("Membership") +
      h1(`Your access through ${escapeHtml(v.team)} ends ${escapeHtml(v.endDate)}.`) +
      p(`Hi ${first(v.name)}. ${escapeHtml(v.team)}'s team membership won't renew, so your Geekdom access ends with it on ${escapeHtml(v.endDate)}. Until then, nothing changes — the portal, rooms and the directory are all yours.`) +
      p("Want to stay on your own? A Solo membership keeps you in the Club.") +
      button(url("/apply"), "Apply for your own membership") +
      muted("Questions? Reply to this email."),
    `${v.team}'s team membership won't renew, so your Geekdom access ends ${v.endDate}. Want to stay on your own? ${url("/apply")}`,
  );
}

/** The owner changed their mind before the end date. */
export function teammateContinuesEmail(v: { name: string; team: string }): Email {
  return email(
    "Your Geekdom access continues",
    `${v.team}'s team membership is staying. Nothing changes.`,
    eyebrow("Membership") +
      h1(`Good news, ${first(v.name)} — you're staying.`) +
      p(`${escapeHtml(v.team)}'s team membership will renew after all, so your access continues as before. Ignore our earlier email.`) +
      button(url("/portal"), "Open the member portal"),
    `${v.team}'s team membership is staying, and so is your Geekdom access.`,
  );
}

/** The team's membership has ended. */
export function teammateEndedEmail(v: { name: string; team: string }): Email {
  return email(
    "Your Geekdom access has ended",
    "Thanks for being part of the room. The door's open whenever you want back in.",
    eyebrow("Membership") +
      h1(`Thanks for being part of the room, ${first(v.name)}.`) +
      p(`${escapeHtml(v.team)}'s team membership has ended, and your portal access with it. You don't owe anything — the team's membership covered you.`) +
      p("The door's open if you'd like to come back on your own.") +
      button(url("/apply"), "Rejoin Geekdom") +
      muted(`Public events are still on <a href="${LUMA_CALENDAR_URL}" style="color:${GRAPHITE};">the calendar</a> — come say hello.`),
    `${v.team}'s team membership has ended, and your Geekdom access with it. Come back on your own any time: ${url("/apply")}`,
  );
}

/** Staff paused the team's membership. */
export function teammatePausedEmail(v: { name: string; team: string }): Email {
  return email(
    "Your Geekdom access is paused",
    `${v.team}'s team membership is paused for now.`,
    eyebrow("Membership") +
      h1(`Your access through ${escapeHtml(v.team)} is paused.`) +
      p(`Hi ${first(v.name)}. ${escapeHtml(v.team)}'s team membership is paused for now, so your portal access is off too. It comes back when theirs does, and we'll email you then.`),
    `${v.team}'s team membership is paused, so your Geekdom access is too. We'll email you when it's back.`,
  );
}

/** The team's membership is active again. */
export function teammateBackEmail(v: { name: string; team: string }): Email {
  return email(
    "Your Geekdom access is back",
    `${v.team}'s team membership is active again.`,
    eyebrow("Membership") +
      h1(`Welcome back, ${first(v.name)}.`) +
      p(`${escapeHtml(v.team)}'s team membership is active again, and so is your access. Sign in with this email address — we'll send you a link.`) +
      button(url("/sign-in"), "Sign in"),
    `${v.team}'s team membership is active again, and so is your Geekdom access. Sign in: ${url("/sign-in")}`,
  );
}

/*
  A DIRECTORY INTRO (lib/portal/intro-actions.ts): one member asks to meet
  another. Sent BY GEEKDOM with Reply-To set to the asker, so the
  recipient's address stays private until they choose to reply — and
  replying is all it takes.
*/
export function introRequestEmail(v: { toName: string; fromName: string; fromHeadline: string; fromTopics: string[]; note: string; profileUrl: string }): Email {
  const asker = escapeHtml(v.fromName);
  return email(
    `${v.fromName} would like to meet you`,
    `A Geekdom member asked for an intro. Reply to answer them directly.`,
    eyebrow("Geekdom Club · Intro") +
      h1(`${first(v.toName)}, ${asker} would like to meet you.`) +
      (v.fromHeadline ? p(`<strong style="font-weight:500;">${asker}</strong> — ${escapeHtml(v.fromHeadline)}`) : "") +
      (v.fromTopics.length ? details([["Ask them about", escapeHtml(v.fromTopics.join(", "))]]) : "") +
      p(`&ldquo;${escapeHtml(v.note).replace(/\n/g, "<br>")}&rdquo;`) +
      p(`<strong style="font-weight:500;">Reply to this email to answer ${first(v.fromName)}</strong> — it goes straight to them. Your email address stays private until you do.`) +
      button(v.profileUrl, `See ${first(v.fromName)}'s profile`) +
      muted("Not a fit right now? No reply needed. You can hide from the directory any time at Profile → Edit."),
    `${v.fromName} would like to meet you.\n\n"${v.note}"\n\nReply to this email to answer them — it goes straight to them. Their profile: ${v.profileUrl}`,
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

/** An owner gave someone access to the Geekdom admin (/portal/admin/team). */
export function adminAccessEmail(v: { name: string; by: string; role?: string }): Email {
  const signIn = url("/sign-in");
  const as = v.role ? ` as ${v.role}` : "";
  return email(
    "You have access to the Geekdom admin",
    `${v.by} gave you access${as}. Sign in with this email address.`,
    eyebrow("Geekdom · Admin") +
      h1(`${first(v.name)}, you have access to the Geekdom admin.`) +
      p(`${escapeHtml(v.by)} added you${escapeHtml(as)}. Sign in with this email address — there's no password; we'll email you a link each time.`) +
      button(signIn, "Sign in") +
      muted("Didn't expect this? Reply to this email and we'll sort it out."),
    `${first(v.name)}, you have access to the Geekdom admin. ${v.by} added you${as}.\n\nSign in with this email address (no password): ${signIn}`,
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

/**
 * A complimentary membership (a perk tag — lib/perks.ts) ends in about 30
 * days. Two cases: they PAY through Stripe and billing simply resumes on
 * the card on file; or there's nothing set up, and they add a card to
 * keep their membership.
 */
export function compEndingEmail(v: { name: string; label: string; endDate: string; resumes: { amount: string; card: string } | null }): Email {
  return email(
    `Your complimentary membership ends ${v.endDate}`,
    v.resumes ? `Your billing picks up again on ${v.endDate}.` : `Add a card to keep your membership after ${v.endDate}.`,
    eyebrow("Membership") +
      h1(v.resumes ? "Your complimentary year is almost up." : "Keep your membership going.") +
      p(`Hi ${first(v.name)}. Your complimentary membership, courtesy of ${v.label}, ends on ${v.endDate}.`) +
      (v.resumes
        ? details([
            ["Billing resumes", v.endDate],
            ["Amount", `${v.resumes.amount}/month`],
            ["Card", v.resumes.card],
          ]) + p("Nothing to do if that card's still right. To change it, open billing in the member portal.") + button(BILLING, "Review billing")
        : p("To keep your membership after that, add a card in the member portal. You won't be charged before then.") + button(BILLING, "Add a card")),
    `Your complimentary Geekdom membership (${v.label}) ends ${v.endDate}. ${v.resumes ? `Billing resumes then: ${v.resumes.amount}/month on ${v.resumes.card}.` : "Add a card to keep your membership."} ${BILLING}`,
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

/** Staff paused a membership that isn't billed through Stripe (Members → status Paused). */
export function membershipPausedEmail(v: { name: string }): Email {
  return email(
    "Your Geekdom membership is paused",
    "Your portal access is paused for now. Nothing is owed.",
    eyebrow("Membership") +
      h1(`Your membership is paused, ${first(v.name)}.`) +
      p("The Club team has paused your membership, so your member portal access is off for now. Nothing is owed while it's paused.") +
      p("When you're ready to come back, reply to this email and we'll switch it on again.") +
      muted(`Public events are still on <a href="${LUMA_CALENDAR_URL}" style="color:${GRAPHITE};">the calendar</a>.`),
    `Your Geekdom membership is paused. Reply to this email when you're ready to come back.`,
  );
}

/** Staff reactivated a paused or ended membership (Members → status Active). */
export function membershipActiveAgainEmail(v: { name: string }): Email {
  return email(
    "Your Geekdom membership is active again",
    "Welcome back. Your member portal is open.",
    eyebrow("Membership") +
      h1(`Welcome back, ${first(v.name)}.`) +
      p("Your membership is active again, and your member portal is open. Sign in with this email address — we'll send you a link.") +
      button(url("/sign-in"), "Sign in"),
    `Your Geekdom membership is active again. Sign in: ${url("/sign-in")}`,
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
    { key: "comp-ending", mail: compEndingEmail({ name, label: "DEVSA community", endDate: "December 19, 2027", resumes: { amount, card: "Visa •••• 4242" } }) },
    { key: "sign-in-link", mail: signInLinkEmail({ link: url("/sign-in") }) },
    { key: "portal-invite", mail: portalInviteEmail({ name }) },
    { key: "email-changed", mail: emailChangedEmail({ name, oldEmail: "jesse@oldmail.com", newEmail: "jesseovr@gmail.com" }) },
    { key: "welcome", mail: memberWelcomeEmail({ name }) },
    { key: "receipt", mail: receiptEmail({ name, amount, date: "October 23, 2026", card: "Visa •••• 4242", invoiceNumber: "GKDM-0006" }) },
    { key: "payment-failed", mail: paymentFailedEmail({ name, amount, card: "Visa •••• 4242" }) },
    { key: "card-expiring", mail: cardExpiringEmail({ name, card: "Visa •••• 4242", exp: "November 2026" }) },
    { key: "cancellation-confirmed", mail: cancellationConfirmedEmail({ name, endDate: "November 22, 2026" }) },
    { key: "membership-ended", mail: membershipEndedEmail({ name }) },
    { key: "membership-paused", mail: membershipPausedEmail({ name }) },
    { key: "intro-request", mail: introRequestEmail({ toName: name, fromName: "Dana Ruiz", fromHeadline: "Building scheduling tools for clinics", fromTopics: ["fundraising", "B2B sales"], note: "I saw you've sold into hospital systems — I'm about to start that process and would love 20 minutes of your time.", profileUrl: url("/portal/directory") }) },
    { key: "teammate-ending", mail: teammateEndingEmail({ name, team: "Acme Co.", endDate: "December 19, 2026" }) },
    { key: "teammate-continues", mail: teammateContinuesEmail({ name, team: "Acme Co." }) },
    { key: "teammate-ended", mail: teammateEndedEmail({ name, team: "Acme Co." }) },
    { key: "teammate-paused", mail: teammatePausedEmail({ name, team: "Acme Co." }) },
    { key: "teammate-back", mail: teammateBackEmail({ name, team: "Acme Co." }) },
    { key: "membership-active-again", mail: membershipActiveAgainEmail({ name }) },
    { key: "welcome-back", mail: welcomeBackEmail({ name, nextPayment: "November 22, 2026" }) },
  ];
}
