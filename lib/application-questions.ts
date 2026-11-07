/*
  GEEKDOM'S APPLICATION QUESTIONS — the ones their Typeform asked, word for
  word, now asked by /apply (November 2026). Read off the Airtable that held
  their answers ("MASTER - ALL"), so imported applications and new ones
  read the same in the admin. Options are verbatim, commas and all.

  Ours on top: the plan picker, and Company (required for Team and
  Enterprise — a team is a company's).

  PURE: the form, the schema, the admin and the importer read it.
*/

export const HEARD_ABOUT = ["Friend or colleague", "Online search", "Event or meetup", "Social media", "Other"] as const;

export const DESCRIBES = [
  "Working on my startup full-time",
  "Working on a startup nights and weekends, still employed elsewhere",
  "Generating real revenue ($10K+ MRR or equivalent)",
  "Earning early revenue (under $10K MRR or equivalent)",
  "Funded (pre-seed, seed, or later)",
  "Innovating inside a company",
  "Between things – recently sold, paused, or exploring what's next",
  "I'm startup and tech curious",
  "Other",
] as const;

/** The questions' wording, in order — the form's labels and the admin's headings. */
export const Q = {
  site: "LinkedIn or personal site",
  heardAbout: "How did you hear about Geekdom?",
  heardAboutOther: "Other (how did you hear?)",
  brag: "Brag about yourself in one sentence.",
  building: "What are you building?",
  shipped: "What have you shipped, sold or built in the last 90 days?",
  links: "Links to work",
  describes: "Which best describes you? Pick all that apply.",
  describesOther: "Other (which describes you?)",
  whyGeekdom: "Why do you want to be a part of Geekdom specifically?",
  giveBack: "What will you give back to the community?",
  excited: "What are you most excited to do over the next 6 months as a member of Geekdom?",
  otherCommunities: "Currently a part of other community, accelerator, incubator or program?",
  anythingElse: "Anything else we should know or you want to share?",
  currentMember: "I'm a current Geekdom member.",
} as const;
