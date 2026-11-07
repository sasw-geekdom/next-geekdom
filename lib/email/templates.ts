/**
 * Transactional email in Geekdom's voice — short sentences, active verbs, one
 * idea per paragraph. The letter to members is the register to match.
 *
 * Inline styles only: email clients strip <style> blocks and never load web
 * fonts. This module is PURE (no server-only imports) so the same functions can
 * render a preview in the browser.
 */

import { CONTACT_EMAIL, LOCATION } from "@/lib/site";

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
