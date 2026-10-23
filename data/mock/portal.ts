/*
  SAMPLE CONTENT FOR THE MEMBER PORTAL — design review only. NONE OF IT IS
  REAL. Every person and company below is invented; every FAQ answer marked
  `confirm` is a placeholder for Geekdom to replace. Pages that render this
  say so on screen (components/portal/sample-notice.tsx).

  What replaces each export:
    MOCK_DIRECTORY   members who opt in to the directory (Phase 3)
    MOCK_FIELD_NOTE  the latest Field Notes post, once /field-notes exists
    MOCK_SLACK       Geekdom's real Slack invite link and channels
    MOCK_FAQ         Geekdom's answers — see `confirm`
    MOCK_RESOURCES   real links as each one exists
    MOCK_BILLING     the member's Stripe subscription and invoices

  Like data/mock/voices.ts: the invented names must not reach production.
*/

import type { Audience } from "@/lib/membership";

export interface DirectoryMember {
  id: string;
  name: string;
  /** One line, in their words: what they're building or doing. */
  headline: string;
  role: string;
  company?: string;
  audience: Audience;
  /** "Ask me about" — what they're happy to help with. */
  askMeAbout: string[];
  /** What they're looking for right now. */
  lookingFor?: string;
  bio: string;
  website?: string;
  linkedin?: string;
  memberSince: string; // ISO
  /** A portrait URL. Sample members get an ILLUSTRATED portrait, never a photo. */
  avatar?: string;
}

export const MOCK_DIRECTORY: DirectoryMember[] = [
  {
    id: "m-1",
    name: "Avery Castellano",
    headline: "Building scheduling software for home-health agencies.",
    role: "Founder & CEO",
    company: "Rounds (sample)",
    audience: "Founder",
    askMeAbout: ["Healthcare sales", "Hiring a first engineer", "Pre-seed fundraising"],
    lookingFor: "Two design partners among San Antonio home-health agencies.",
    bio: "Ten years running operations for a home-health agency before starting Rounds. At the Club most weekday mornings.",
    website: "https://example.com",
    linkedin: "https://www.linkedin.com/",
    memberSince: "2025-03-04T18:00:00.000Z",
  },
  {
    id: "m-2",
    name: "Marcus Oyelaran",
    headline: "Staff engineer, happiest deep in a data pipeline.",
    role: "Staff Engineer",
    company: "Northpoint Logistics (sample)",
    audience: "Engineer or builder",
    askMeAbout: ["Data engineering", "Postgres", "Code review for early teams"],
    bio: "Remote for a Dallas company; comes to Geekdom for the room. Mentors at Startup Bootcamp.",
    linkedin: "https://www.linkedin.com/",
    memberSince: "2024-09-12T18:00:00.000Z",
  },
  {
    id: "m-3",
    name: "Priya Raman",
    headline: "Product designer turning clinical workflows into calm software.",
    role: "Independent Product Designer",
    audience: "Creator",
    askMeAbout: ["Product design", "User research", "Design systems"],
    lookingFor: "One more early-stage client for Q1.",
    bio: "Formerly design lead at a health-tech scale-up. Runs the occasional design critique in the Club.",
    website: "https://example.com",
    memberSince: "2025-01-21T18:00:00.000Z",
  },
  {
    id: "m-4",
    name: "Diego Villarreal",
    headline: "Operator who's scaled two B2B teams from five to fifty.",
    role: "Fractional COO",
    audience: "Operator",
    askMeAbout: ["Ops and finance setup", "First sales hire", "Board decks"],
    bio: "Works with three Studio-stage companies at a time. Ask him about a spreadsheet and lose an afternoon.",
    linkedin: "https://www.linkedin.com/",
    memberSince: "2023-06-02T18:00:00.000Z",
  },
  {
    id: "m-5",
    name: "Hannah Brightwater",
    headline: "Angel investor, mostly B2B software in Texas.",
    role: "Angel Investor",
    audience: "Investor",
    askMeAbout: ["Pitch feedback", "SAFE terms", "Investor updates"],
    bio: "Former founder (acquired). Writes six to eight checks a year and holds office hours at the Club.",
    memberSince: "2022-11-15T18:00:00.000Z",
  },
  {
    id: "m-6",
    name: "Tomás Echeverría",
    headline: "Leads innovation partnerships for a regional health system.",
    role: "Director of Innovation",
    company: "Alamo Health (sample)",
    audience: "Corporate or civic leader",
    askMeAbout: ["Selling into hospitals", "Pilot programs", "Procurement"],
    lookingFor: "Startups working on nurse retention.",
    bio: "The person to meet before you pitch a hospital. Prefers coffee to email.",
    linkedin: "https://www.linkedin.com/",
    memberSince: "2024-02-27T18:00:00.000Z",
  },
  {
    id: "m-7",
    name: "Keiko Hartwell",
    headline: "Building a marketplace for local makers.",
    role: "Co-founder",
    company: "Maker Row (sample)",
    audience: "Founder",
    askMeAbout: ["Marketplaces", "Shopify", "Community-led growth"],
    bio: "Second-time founder. First company was a food truck, which she says taught her more than business school.",
    website: "https://example.com",
    memberSince: "2025-07-08T18:00:00.000Z",
  },
  {
    id: "m-8",
    name: "Jordan Pike",
    headline: "Full-stack engineer, open to the right early team.",
    role: "Software Engineer",
    audience: "Engineer or builder",
    askMeAbout: ["Next.js", "Shipping MVPs", "AI tooling"],
    lookingFor: "A founding-engineer role at a San Antonio startup.",
    bio: "Moved to San Antonio last year. Joined the Club to find the people building here.",
    linkedin: "https://www.linkedin.com/",
    memberSince: "2026-02-10T18:00:00.000Z",
  },
  {
    id: "m-9",
    name: "Renata Solís",
    headline: "Brand strategist for founders who sell to other businesses.",
    role: "Founder",
    company: "Solís Studio (sample)",
    audience: "Creator",
    askMeAbout: ["Positioning", "Naming", "Website copy"],
    bio: "Has rewritten more homepages than she can count. Will tell you, kindly, what yours actually says.",
    website: "https://example.com",
    memberSince: "2023-10-19T18:00:00.000Z",
  },
  {
    id: "m-10",
    name: "Sam Whitfield",
    headline: "Runs revenue at a cybersecurity startup.",
    role: "VP of Sales",
    company: "Bastion Labs (sample)",
    audience: "Operator",
    askMeAbout: ["Enterprise sales", "Security buyers", "Pricing"],
    bio: "San Antonio's cyber scene is why he moved here. Hosts a monthly sales roundtable for members.",
    linkedin: "https://www.linkedin.com/",
    memberSince: "2024-05-30T18:00:00.000Z",
  },
];

/** The latest Field Notes post — invented. */
export const MOCK_FIELD_NOTE = {
  title: "What we heard at Open Coffee this month",
  excerpt:
    "Hiring was the question at every table — who to bring on first, and when a contractor stops being enough. Here's what members told each other.",
  date: "2026-10-16T17:00:00.000Z",
  readMinutes: 4,
  href: "#",
};

/** The member Slack — not set up yet. Channel names are placeholders. */
export const MOCK_SLACK = {
  inviteUrl: null as string | null,
  channels: ["#introductions", "#asks-and-offers", "#events", "#wins", "#jobs"],
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
        q: "How do I book a call room or the event space?",
        a: "Phone booths and call rooms are first come, first served; booking for meeting and event space is Geekdom's to describe.",
        confirm: true,
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
  { title: "Book a room", description: "Meeting and event space for members.", href: null },
  { title: "Contact the Club team", description: "club@geekdom.com — questions, ideas, anything.", href: "mailto:club@geekdom.com" },
];

/** A member's billing, as Stripe would show it — invented. */
export const MOCK_BILLING = {
  card: { brand: "Visa", last4: "4242", exp: "08/28" },
  nextPayment: "2026-11-23T18:00:00.000Z",
  history: [
    { date: "2026-10-23T18:00:00.000Z", status: "Paid" },
    { date: "2026-09-23T18:00:00.000Z", status: "Paid" },
    { date: "2026-08-23T18:00:00.000Z", status: "Paid" },
  ],
  /** Invoices as the billing drawer lists them — Stripe-style numbers, invented. */
  invoices: [
    { id: "in_6", number: "GKDM-0006", date: "2026-10-23T18:00:00.000Z", status: "paid" as const },
    { id: "in_5", number: "GKDM-0005", date: "2026-09-23T18:00:00.000Z", status: "paid" as const },
    { id: "in_4", number: "GKDM-0004", date: "2026-08-23T18:00:00.000Z", status: "paid" as const },
    { id: "in_3", number: "GKDM-0003", date: "2026-07-23T18:00:00.000Z", status: "paid" as const },
    { id: "in_2", number: "GKDM-0002", date: "2026-06-23T18:00:00.000Z", status: "paid" as const },
  ],
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
  currentPeriodEnd: "2026-11-04T18:00:00.000Z",
  cancelAtPeriodEnd: false,
  status: "active" as const,
};

