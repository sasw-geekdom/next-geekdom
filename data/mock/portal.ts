/*
  SAMPLE CONTENT FOR THE MEMBER PORTAL — design review only. NONE OF IT IS
  REAL. Every person and company below is invented; every FAQ answer marked
  `confirm` is a placeholder for Geekdom to replace. Pages that render this
  say so on screen (components/portal/sample-notice.tsx).

  What replaces each export:
    MOCK_FIELD_NOTE  the latest Field Notes post, once /field-notes exists
    MOCK_SLACK       Geekdom's real Slack invite link and channels
    MOCK_FAQ         Geekdom's answers — see `confirm`
    MOCK_RESOURCES   real links as each one exists
    MOCK_BILLING     the member's Stripe subscription and invoices

  Like data/mock/voices.ts: the invented names must not reach production.
*/

import type { Audience } from "@/lib/membership";

/** The latest Field Notes post — invented. */
export const MOCK_FIELD_NOTE = {
  title: "What we heard at Open Coffee this month",
  excerpt:
    "Hiring was the question at every table — who to bring on first, and when a contractor stops being enough. Here's what members told each other.",
  date: "2026-10-16T17:00:00.000Z",
  readMinutes: 4,
  href: "#",
};

export interface FaqItem {
  q: string;
  a: string;
  /** A placeholder answer Geekdom must write or confirm. */
  confirm?: boolean;
}

export const MOCK_FAQ: { group: string; items: FaqItem[] }[] = [
  {
    group: "The clubhouse",
    items: [
      {
        q: "When can I come in?",
        a: "Any time. Membership includes 24/7 access to the clubhouse on the third floor of the Rand Building.",
      },
      {
        q: "Can I bring a guest?",
        a: "Guests are part of membership. The details — how many, how often, and whether to let the front desk know — are Geekdom's to set.",
        confirm: true,
      },
      {
        q: "How do I book a conference room?",
        a: "Under Book a room. Pick a day and a free time — it's yours straight away. Up to 4 hours at a time, up to a week ahead, every day, 8 AM – 6 PM. Running long? Add time to your booking while the room is free after it. Phone booths and call rooms are first come, first served.",
        confirm: false,
      },
      {
        q: "What's the Wi-Fi?",
        a: "Network name and password, posted here once Geekdom provides them.",
        confirm: true,
      },
    ],
  },
  {
    group: "Your membership",
    items: [
      {
        q: "Where are my receipts?",
        a: "Profile → Manage billing. Every invoice and receipt is listed there, with a PDF of each — no need to leave the portal.",
      },
      {
        q: "How do I change how I appear in the directory?",
        a: "Edit your profile under Profile. The directory shows only members who choose to be listed.",
      },
      {
        q: "Can I pause my membership?",
        a: "Whether and how members can pause is Geekdom's policy to write here.",
        confirm: true,
      },
      {
        q: "Who do I ask about anything else?",
        a: "Email club@geekdom.com and the Club team will get back to you.",
      },
    ],
  },
];

export interface ResourceLink {
  title: string;
  description: string;
  href: string | null; // null = not available yet
  external?: boolean;
}

export const MOCK_RESOURCES: ResourceLink[] = [
  { title: "Member Slack", description: "Where members ask, offer and find each other between visits.", href: null },
  { title: "Events calendar", description: "Everything on the floor this month, on Luma.", href: "https://luma.com/geekdom", external: true },
  { title: "Getting here", description: "The address, the map and the elevator to the third floor.", href: "/contact" },
  { title: "House guidelines", description: "How the clubhouse works, so it keeps working for everyone.", href: null },
  { title: "Book a room", description: "The conference rooms, up to a week ahead.", href: "/portal/rooms" },
  { title: "Contact the Club team", description: "club@geekdom.com — questions, ideas, anything.", href: "mailto:club@geekdom.com" },
];

/*
  THE SAMPLE'S DATES ROLL FROM TODAY (Jesse, November 2026): fixed dates
  went stale — the sample said "stays active until November 4" after the
  4th had passed. The billing day is today's day of the month; the next
  payment is a month out, past invoices the months before. Midday Central.
  Worked out when the server starts, which is fresh enough for a preview.
*/
function monthsFromToday(n: number): string {
  // TODAY IN SAN ANTONIO, not UTC — after 6 PM Central, UTC is already tomorrow.
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date())
    .split("-")
    .map(Number);
  // Day 28 at most, so every month has it.
  return new Date(Date.UTC(y, m - 1 + n, Math.min(day, 28), 18)).toISOString();
}

/** A member's billing, as Stripe would show it — invented, dates relative to today. */
export const MOCK_BILLING = {
  card: { brand: "Visa", last4: "4242", exp: "08/28" },
  nextPayment: monthsFromToday(1),
  history: [0, -1, -2].map((n) => ({ date: monthsFromToday(n), status: "Paid" })),
  /** Invoices as the billing drawer lists them — Stripe-style numbers, invented. */
  invoices: [6, 5, 4, 3, 2].map((k, i) => ({ id: `in_${k}`, number: `GKDM-000${k}`, date: monthsFromToday(-i), status: "paid" as const })),
};

/** The signed-in member's directory profile — invented starting values. */
export const MOCK_MY_PROFILE = {
  headline: "Building something new in San Antonio.",
  role: "Founder",
  company: "",
  audience: "Founder" as Audience,
  askMeAbout: ["Early-stage fundraising"],
  lookingFor: "",
  bio: "",
  website: "",
  linkedin: "",
  listed: true,
};

/** A sample member's membership card, shown to staff as a preview — invented. */
export const MOCK_MEMBER_CARD = {
  name: "Avery Castellano",
  email: "avery@example.com",
  joinedAt: "2025-03-04T18:00:00.000Z",
  // The same rolling date as the sample billing, so the card and the drawer agree.
  currentPeriodEnd: monthsFromToday(1),
  cancelAtPeriodEnd: false,
  status: "active" as const,
};

