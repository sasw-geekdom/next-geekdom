/*
  TAGS & PERKS — pure, shared by the admin screens and the server.

  Staff tag members (the member slide-out's Tags field). Most tags are just
  labels ("founding member"). A PERK TAG also changes billing: "DEVSA
  community" makes a membership COMPLIMENTARY for 12 months from the day
  it's applied (Geekdom, November 2026 — tags rather than discount codes:
  a code is something a member has to know and type; a tag is staff
  deciding "this person gets this").

  The definitions live in one settings doc (lib/perks-server.ts), edited by
  OWNERS at Settings → Tags & perks; any staff apply them. A member's
  complimentary period is stamped on THEIR record when the tag is applied
  (`MemberDoc.comp`), so editing a tag's terms later never silently changes
  anyone who already has it.
*/

export type PerkEffect = "none" | "free_months" | "free_forever";

export interface PerkTag {
  /** The tag as members carry it — lowercased, like every member tag (the match key). */
  name: string;
  /** How it reads to people: "DEVSA community". */
  label: string;
  effect: PerkEffect;
  /** For `free_months`. */
  months: number;
  /** For staff: where the perk came from, who agreed it. */
  note: string;
}

export const PERK_EFFECT_LABELS: Record<PerkEffect, string> = {
  none: "Label only",
  free_months: "Complimentary for a set time",
  free_forever: "Complimentary, no end date",
};

/** A member's complimentary period, as stamped when the perk tag was applied. ISO dates. */
export interface CompPeriod {
  tag: string;
  /** The perk's label when it was applied — what the member and staff read. */
  label: string;
  since: string;
  /** null = no end date. */
  until: string | null;
  by: string;
  /** True when the site paused a Stripe subscription for it (so removing the tag resumes it). */
  paused: boolean;
  /** When the 30-days-before reminder went out (app/api/cron/comp-reminders) — sent once. */
  remindedAt?: string;
}

export const isPerk = (t: PerkTag | undefined): t is PerkTag => Boolean(t && t.effect !== "none");

/** "Complimentary for 12 months", "Complimentary, no end date", "Label only". */
export function perkSummary(t: PerkTag): string {
  if (t.effect === "free_months") return `Complimentary for ${t.months} ${t.months === 1 ? "month" : "months"}`;
  return PERK_EFFECT_LABELS[t.effect];
}

/** When a perk applied today ends: `months` calendar months on, at the same time. null = never. */
export function compUntil(t: PerkTag, from: Date): Date | null {
  if (t.effect === "free_forever") return null;
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + Math.max(1, t.months));
  return d;
}

/** Is this period running now? (A plain boolean — for JSX, where the guard below would narrow the "ended" case away.) */
export const compRunning = (c: CompPeriod | null | undefined, now = Date.now()): boolean =>
  Boolean(c && Date.parse(c.since) <= now && (c.until === null || Date.parse(c.until) > now));

/** Is this period running now? (Type guard.) */
export const compActive = (c: CompPeriod | null | undefined, now = Date.now()): c is CompPeriod =>
  Boolean(c && Date.parse(c.since) <= now && (c.until === null || Date.parse(c.until) > now));

/**
 * Of a member's tags, the perk that gives the MOST — no end date beats any
 * date, a later end beats an earlier one. Used when a member carries two.
 */
export function bestPerk(tags: string[], defs: PerkTag[], from: Date): { tag: PerkTag; until: Date | null } | null {
  let best: { tag: PerkTag; until: Date | null } | null = null;
  for (const name of tags) {
    const t = defs.find((d) => d.name === name);
    if (!isPerk(t)) continue;
    const until = compUntil(t, from);
    if (!best || until === null || (best.until !== null && until > best.until)) best = { tag: t, until };
    if (best.until === null) break;
  }
  return best;
}

export const compDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(new Date(iso));

/** "Complimentary until November 19, 2027 · DEVSA community" — the member's and staff's one line. */
export const compLine = (c: CompPeriod) => `Complimentary ${c.until ? `until ${compDate(c.until)}` : "— no end date"} · ${c.label}`;
