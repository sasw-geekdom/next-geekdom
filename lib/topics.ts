/*
  STARTER "ASK ME ABOUT" TOPICS (Jesse, November 2026). Suggestions come
  from what members already use — and on launch day nobody has any, so
  the first members would get none and the spellings would drift. These
  fill in behind real usage: topics members use come first (most common
  first), then whichever starters aren't taken yet. Geekdom may want to
  edit the list; it's only ever a suggestion.
*/
export const STARTER_TOPICS = [
  "Fundraising",
  "Hiring",
  "B2B sales",
  "Product",
  "Design",
  "Engineering",
  "Marketing",
  "AI",
  "Legal",
  "Finance",
  "Real estate",
  "Healthcare",
] as const;

/** Topics in use first, then the starters nobody has used yet (matched without case). */
export function withStarters(inUse: string[]): string[] {
  const seen = new Set(inUse.map((t) => t.toLowerCase()));
  return [...inUse, ...STARTER_TOPICS.filter((t) => !seen.has(t.toLowerCase()))];
}
