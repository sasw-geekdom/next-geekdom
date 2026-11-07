/*
  INQUIRIES — the two requests a non-member sends Geekdom, run through the
  admin like applications (November 2026, replacing the Typeform mockups):

    event    /club "Host an event": a company booking Geekdom for an
             offsite, a planning day, a workshop or a client event.
             Companies only — no membership needed, no private parties.
    partner  /studio "If you're a corporate partner": a company that wants
             to work with Studio companies.

  ONE REVIEW STEP, not the Club's two: these are requests to talk, not
  memberships. new → accepted ("yes, let's talk") | declined, each with its
  email; reopen undoes a decline. The questions are the ones proposed to
  Geekdom in the mockups.

  PURE (no server-only imports): the form, the API and the admin read it.
*/

export const INQUIRY_KINDS = ["event", "partner"] as const;
export type InquiryKind = (typeof INQUIRY_KINDS)[number];

export const INQUIRY_STATUSES = ["new", "accepted", "declined"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const EVENT_TYPES = ["Team offsite", "Planning or strategy day", "Workshop or training", "Client or partner event", "Something else"] as const;
export const HEADCOUNTS = ["Under 20", "20–50", "50–100", "More than 100"] as const;
export const PARTNER_INTERESTS = ["Pilots", "Talent access", "Follow-on introductions", "Not sure yet"] as const;

export interface InquiryKindCopy {
  /** The admin's tab and the activity log's area wording. */
  label: string;
  /** The form's heading, in the slide-out. */
  title: string;
  intro: string;
  /** Shown in place of the form once it's sent. */
  thanks: string;
  /** "Accept" and "Decline" in the admin, and what each emails. */
  accept: { label: string; hint: string };
  decline: { label: string; hint: string };
}

export const INQUIRY_COPY: Record<InquiryKind, InquiryKindCopy> = {
  event: {
    label: "Event requests",
    title: "Host an event at Geekdom",
    intro: "Tell us about your event. It takes about two minutes, and someone on the Geekdom team will get back to you.",
    thanks: "Thanks — we have your request. Someone on the Geekdom team will be in touch.",
    accept: { label: "Yes — let's plan it", hint: "Emails them that we'd like to host it and will reach out to plan." },
    decline: { label: "Not a fit — decline", hint: "Emails them a kind no." },
  },
  partner: {
    label: "Studio partners",
    title: "Partner with the Studio",
    intro: "We work with a small number of corporate partners each year. Tell us a little about yours.",
    thanks: "Thanks — we have your note. We'll be in touch about whether it's a fit.",
    accept: { label: "Yes — let's talk", hint: "Emails them that we'd like to talk and will reach out." },
    decline: { label: "Not a fit — decline", hint: "Emails them a kind no." },
  },
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  accepted: "Accepted",
  declined: "Declined",
};
