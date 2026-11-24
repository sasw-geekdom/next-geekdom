/*
  THE TERMS OF MEMBERSHIP — what a member agrees to before the portal opens
  (Geekdom, November 2026: "member should not be able to view the member
  portal until we capture that").

  The agreement is RECORDED, with the version agreed to, on the member
  (`MemberDoc.terms`). Bump TERMS_VERSION whenever the text on /terms
  changes in substance: every member is asked again at their next visit,
  because what they agreed to is no longer what's on the page.

  GEEKDOM IS SENDING NEW TERMS. When they arrive, replace the text at
  app/(site)/terms/page.tsx and bump this version.
*/
export const TERMS_VERSION = "2026-11";
export const TERMS_PATH = "/terms";

export interface TermsAgreement {
  version: string;
  /** ISO. */
  acceptedAt: string;
}

/** Has this member agreed to the CURRENT terms? */
export const termsCurrent = (t: { version?: string } | null | undefined) => t?.version === TERMS_VERSION;
