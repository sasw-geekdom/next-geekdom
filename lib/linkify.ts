/*
  LINKS IN FREEHAND ANSWERS — pure, for the admin's review pages.

  Applicants type links any way they like: "https://…", "www.…",
  "linkedin.com/in/someone", several to a line, separated by commas or
  spaces — and two in three imported answers have no "https://" at all.
  So a link is anything shaped like a domain (letters, a dot, a 2–24
  letter ending) with an optional path, and it's given https:// to open.
  Anything else ("N/A", "see resume") stays text. Only http(s) is ever
  produced, so a typed "javascript:" can't become a link.
*/

const LINK = /\b((?:https?:\/\/)?(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,24}(?::\d{2,5})?(?:\/[^\s<>"']*)?)/gi;

/** Words that look like domains but aren't links in this context. */
const NOT_LINKS = /^(e\.g|i\.e|etc|a\.m|p\.m|u\.s|vs)\.?$/i;

export interface TextPart {
  text: string;
  /** Set when this part is a link: the address to open. */
  href?: string;
}

/** The address to open for a typed link, or null when it isn't one. */
export function hrefFor(raw: string): string | null {
  // Trailing punctuation belongs to the sentence, not the link.
  const t = raw.trim().replace(/[.,;:!?)\]]+$/, "");
  if (!t || NOT_LINKS.test(t) || /@/.test(t)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!/\.[a-z]{2,24}$/i.test(u.hostname)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Text split into plain parts and link parts, in order. */
export function splitLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const raw = m[0];
    const trimmed = raw.replace(/[.,;:!?)\]]+$/, "");
    const href = hrefFor(trimmed);
    const start = m.index ?? 0;
    // An email address is left as text (the "@" sits just before the match).
    if (!href || text[start - 1] === "@") continue;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: trimmed, href });
    last = start + trimmed.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** A link as people read it: host and path, no scheme, no "www.", no trailing slash. */
export function prettyLink(href: string): string {
  try {
    const u = new URL(href);
    return (u.hostname.replace(/^www\./, "") + u.pathname + u.search).replace(/\/$/, "");
  } catch {
    return href;
  }
}

/**
 * "Nothing here" answers — N/A, none, no, "-" — said instead of leaving a
 * field blank. They aren't information, so the Links row drops them
 * (beside a real link, an "N/A" read as noise).
 */
const NOTHING = /^(n\/?a\.?|none\.?|no|nope|nothing|not applicable|not yet|tbd|-+|\.+|na\.?)$/i;
export const isNothing = (s: string) => NOTHING.test(s.trim());

/**
 * Every link across several freehand answers, once each, in order — plus
 * whatever in them WASN'T a link and isn't a "nothing here" (so "portfolio
 * on request" still shows, but "N/A" doesn't).
 */
export function collectLinks(...values: (string | undefined)[]): { links: string[]; other: string[] } {
  const links: string[] = [];
  const other: string[] = [];
  const seen = new Set<string>();
  for (const v of values) {
    if (!v?.trim()) continue;
    for (const p of splitLinks(v)) {
      if (p.href) {
        const key = p.href.replace(/\/$/, "").replace("://www.", "://").toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          links.push(p.href);
        }
      } else {
        const rest = p.text.replace(/[\s,;|·•\-–—]+/g, " ").trim();
        if (rest && !/^(and|or)$/i.test(rest) && !isNothing(rest)) other.push(rest);
      }
    }
  }
  return { links, other };
}
