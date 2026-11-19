import { docText, safeHref } from "@/lib/field-notes/schemas";
import type { RichDoc } from "@/lib/field-notes/types";

/*
  THE RESEARCH STEP'S VOCABULARY — pure, so the admin's client panel, the
  emails and the server actions share one list (lib/firebase/collections.ts
  is server-only).

  Research is Monica's step: she looks the applicant up, writes it up, and
  makes a RECOMMENDATION. It guides the team, who decide in a meeting of
  three or four; it never decides on its own.
*/

export type ResearchRecommendation = "approve" | "decline" | "unsure";

export const RECOMMENDATIONS: ResearchRecommendation[] = ["approve", "decline", "unsure"];

export const RECOMMENDATION_LABELS: Record<ResearchRecommendation, string> = {
  approve: "Approve",
  decline: "Decline",
  unsure: "Unsure — discuss",
};

/** A decline from research must say why, in at least a few words. */
export const MIN_DECLINE_REASON = 10;

/**
 * Where a new write-up starts: BLANK, with a one-line prompt in the editor.
 * A three-section template (Who they are · What I found · Concerns) was
 * tried and dropped (Jesse) — Monica's own format can become one later.
 */
export const EMPTY_RESEARCH: RichDoc = { type: "doc", content: [{ type: "paragraph" }] };

/** Has anything been written? */
export function hasWriting(doc: RichDoc): boolean {
  return docText(doc).length > 0;
}

/**
 * THE OLD STAFF NOTES, AS A WRITE-UP. Before the write-up existed, an
 * application's research lived in a plain "staff notes" field — mostly
 * Airtable's, imported. They ARE the old write-ups, so an application with
 * notes and no write-up opens its Write-up with them: blank lines become
 * paragraphs, single line breaks stay, and web addresses become links (so
 * they land in "Links shared"). Saving the write-up stores it as one.
 */
export function notesToDoc(notes: string): RichDoc {
  const url = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;
  const inline = (line: string): RichDoc["content"] =>
    line
      .split(url)
      .filter(Boolean)
      .map((part) => {
        const href = /^https?:\/\//.test(part) ? safeHref(part) : null;
        return href ? { type: "text", text: part, marks: [{ type: "link", attrs: { href } }] } : { type: "text", text: part };
      });
  const paragraphs = notes
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => ({
      type: "paragraph",
      content: p.split("\n").flatMap((line, i) => [...(i > 0 ? [{ type: "hardBreak" }] : []), ...inline(line)]),
    }));
  return { type: "doc", content: paragraphs.length ? paragraphs : [{ type: "paragraph" }] };
}
