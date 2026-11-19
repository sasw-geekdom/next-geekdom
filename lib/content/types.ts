/** What every admin content action returns to its form. */
export type ActionResult =
  | { ok: true; id?: string; count?: number; note?: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> };
