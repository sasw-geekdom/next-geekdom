import type { MemberVoice } from "@/lib/site";

/**
 * MOCK — what members say.
 *
 * INVENTED. The names are not real people and the quotes were not said by
 * anyone; they exist so the section can be judged before the real ones are
 * gathered. Lengths are deliberately uneven — a two-line quote beside a
 * four-line one is the case the layout has to survive, and a set of tidy
 * equal-length quotes would prove nothing.
 *
 * Replace every entry before launch. A testimonial is a claim about a person,
 * so these must not outlive the design review.
 */
export const MOCK_MEMBER_VOICES: readonly MemberVoice[] = [
  {
    quote:
      "I brought a pricing problem to office hours expecting a sanity check. I left with the whole model rebuilt, by someone who had already made the mistake I was about to make.",
    name: "Maya Restrepo",
    role: "Co-founder, Cardinal Health Data",
  },
  {
    quote:
      "The person at the next table introduced me to my first enterprise customer. That was six weeks after I joined.",
    name: "Tobi Adeyemi",
    role: "Founder, Ledgerline",
  },
  {
    quote:
      "Pitch night is the only room in this city that tells you the truth. It is not always pleasant and it has never once been useless.",
    name: "Priya Raman",
    role: "Engineer and builder",
  },
  {
    quote:
      "I invest here because this is where I meet founders before anyone else does.",
    name: "Daniel Okonkwo",
    role: "Partner, Riverbend Capital",
  },
];
