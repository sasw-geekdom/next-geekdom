import type { MemberVoice } from "@/lib/site";

/**
 * What members say — EMPTY UNTIL THE QUOTES ARE REAL.
 *
 * This file used to hold four quotations attributed to four named people. All
 * eight were invented. They were written to let the layout be judged before
 * real ones existed, with a note saying to replace them before launch — but
 * they were rendering on the homepage of a deployed site, which is the point at
 * which "placeholder" stops being an accurate description of them.
 *
 * A fabricated testimonial is not the same class of placeholder as lorem ipsum
 * or a gray box. It is a claim about a person who does not exist, presented as
 * evidence, on the one section of the site whose entire job is evidence. The
 * 2026 brand guide's loudest rule is "Real people, named. No stock." — and its
 * one-line test for anything Geekdom publishes is whether it celebrates a real
 * person. Invented quotes fail both, and they fail them in the way that costs
 * the most if noticed.
 *
 * `MemberVoices` returns null on an empty list, so the section simply does not
 * render. The homepage reads fine without it: "Who's in the room" sits directly
 * above and makes the same argument in Geekdom's own voice rather than in a
 * stranger's.
 *
 * TO FILL IT: one or two sentences each, with a real name and a real role —
 * the role is what makes a quote weigh anything. Keep the lengths uneven; a set
 * of tidy equal-length quotes reads as written-by-committee, and the layout is
 * built to survive a two-line quote beside a four-line one.
 *
 * To judge the layout again before real quotes arrive, paste sample entries in
 * here temporarily — but do not commit them.
 */
export const MOCK_MEMBER_VOICES: readonly MemberVoice[] = [];
