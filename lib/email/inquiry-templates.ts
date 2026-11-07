/**
 * THE INQUIRY EMAILS — event requests (/club "Host an event") and Studio
 * partner inquiries, on the member emails' brand (./member-templates.ts).
 *
 *   requester  received → accepted | declined
 *   staff      new request
 *
 * Voice: short, specific about what happens next. A decline for an event
 * says why it usually happens (company events only, the calendar) without
 * pretending to know this one's reason.
 *
 * PURE (no server-only imports).
 */

import { escapeHtml } from "@/lib/email/templates";
import { button, details, email, eyebrow, first, h1, muted, p, url, type Email } from "@/lib/email/member-templates";
import type { InquiryKind } from "@/lib/inquiries";

interface Who {
  name: string;
  company: string;
}

const firstPlain = (name: string) => name.trim().split(/\s+/)[0] || "there";

/** The moment they send it. */
export function inquiryReceivedEmail(kind: InquiryKind, v: Who): Email {
  if (kind === "event") {
    return email(
      "We have your event request",
      "Someone on the Geekdom team will be in touch about hosting it.",
      eyebrow("Geekdom · Host an event") +
        h1(`Thanks, ${first(v.name)}. We have your request.`) +
        p(`Someone on the Geekdom team will read it and get back to you about hosting ${escapeHtml(v.company)}'s event — usually within a few business days.`) +
        muted("Anything to add in the meantime? Reply to this email."),
      `Thanks, ${firstPlain(v.name)}. We have your event request, and someone on the Geekdom team will get back to you — usually within a few business days.`,
    );
  }
  return email(
    "We have your note about the Studio",
    "We'll be in touch about whether it's a fit.",
    eyebrow("Geekdom Studio · Partners") +
      h1(`Thanks, ${first(v.name)}. We have your note.`) +
      p(`We work with a small number of corporate partners each year. Someone on the Studio team will read about ${escapeHtml(v.company)} and get back to you about whether it's a fit.`),
    `Thanks, ${firstPlain(v.name)}. We have your note about partnering with the Studio and will be in touch about whether it's a fit.`,
  );
}

/** Staff said yes. */
export function inquiryAcceptedEmail(kind: InquiryKind, v: Who): Email {
  if (kind === "event") {
    return email(
      "Let's plan your event at Geekdom",
      "We'd like to host it. Someone will reach out to plan the details.",
      eyebrow("Geekdom · Host an event") +
        h1(`${first(v.name)}, we'd like to host it.`) +
        p(`Good news: Geekdom can host ${escapeHtml(v.company)}'s event. Someone on our team will reach out shortly to settle the date, the room, the setup and the cost.`) +
        muted("Questions before then? Reply to this email."),
      `${firstPlain(v.name)}, we'd like to host ${v.company}'s event. Someone on our team will reach out shortly to plan the details.`,
    );
  }
  return email(
    "Let's talk about the Studio",
    "We'd like to talk. Someone will reach out to set up a conversation.",
    eyebrow("Geekdom Studio · Partners") +
      h1(`${first(v.name)}, let's talk.`) +
      p(`We'd like to talk with ${escapeHtml(v.company)} about working with Studio companies. Someone on the Studio team will reach out to set up a conversation.`) +
      muted("Anything to share before then? Reply to this email."),
    `${firstPlain(v.name)}, we'd like to talk with ${v.company} about working with Studio companies. Someone will reach out to set up a conversation.`,
  );
}

/** Staff said no. Kind, and honest about what usually decides it. */
export function inquiryDeclinedEmail(kind: InquiryKind, v: Who): Email {
  if (kind === "event") {
    return email(
      "About your event request",
      "We're not able to host this one.",
      eyebrow("Geekdom · Host an event") +
        h1(`${first(v.name)}, thank you for thinking of Geekdom.`) +
        p("We're not able to host this event. It's usually the calendar, or a format the space isn't right for — we host company events, not private parties.") +
        p("If your plans change, or you have another event in mind, we'd be glad to hear about it."),
      `${firstPlain(v.name)}, thank you for thinking of Geekdom. We're not able to host this event — usually it's the calendar, or a format the space isn't right for. If your plans change, we'd be glad to hear about it.`,
    );
  }
  return email(
    "About partnering with the Studio",
    "It isn't the right fit for the Studio right now.",
    eyebrow("Geekdom Studio · Partners") +
      h1(`${first(v.name)}, thank you for reaching out.`) +
      p(`We've read your note, and partnering with the Studio isn't the right fit right now. We work with very few partners at a time, so this says more about our capacity than about ${escapeHtml(v.company)}.`) +
      p("If things change on your side, we'd be glad to hear from you again."),
    `${firstPlain(v.name)}, thank you for reaching out. Partnering with the Studio isn't the right fit right now — we work with very few partners at a time.`,
  );
}

/** To staff: a new request, with everything they asked. */
export function inquiryStaffEmail(
  kind: InquiryKind,
  id: string,
  v: Who & { email: string; eventType?: string; headcount?: string; when?: string; interest?: string; details?: string },
): Email {
  const review = url(`/portal/admin/requests/${id}`);
  const rows: [string, string][] =
    kind === "event"
      ? [
          ["Company", v.company],
          ["Contact", `${v.name} · ${v.email}`],
          ["Event", v.eventType ?? "—"],
          ["People", v.headcount ?? "—"],
          ["When", v.when ?? "—"],
        ]
      : [
          ["Company", v.company],
          ["Contact", `${v.name} · ${v.email}`],
          ["Interest", v.interest ?? "—"],
        ];
  const what = kind === "event" ? "event request" : "Studio partner request";
  return email(
    `New ${what}: ${v.company}`,
    `${v.name} at ${v.company} sent a ${what}.`,
    eyebrow(kind === "event" ? "Requests · Event request" : "Requests · Studio partner") +
      h1(`${escapeHtml(v.company)} sent a ${what}.`) +
      details(rows) +
      (v.details ? muted("What they said") + p(escapeHtml(v.details)) : "") +
      button(review, "Review it"),
    `${v.company} sent a ${what}.\n\n${rows.map(([k, val]) => `${k}: ${val}`).join("\n")}${v.details ? `\n\n${v.details}` : ""}\n\nReview: ${review}`,
  );
}
