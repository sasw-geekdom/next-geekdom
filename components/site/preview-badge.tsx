import { IS_PREVIEW } from "@/lib/preview";

/**
 * A standing marker that this deploy is for review and its data is invented.
 *
 * Without it the preview is indistinguishable from the real thing, and that
 * ambiguity costs something specific: a reviewer submits the apply form, gets a
 * confirmation, and reasonably believes an application exists. Nothing was
 * saved. The same goes for the calendar — those events are not real, and
 * somebody will otherwise put one in their diary.
 *
 * Bottom-RIGHT on purpose: Next's own dev indicator holds the bottom-left, and
 * two overlapping badges would obscure each other.
 *
 * Gold on ink is the pairing that survives this ground — 9.3:1. Rust would be
 * 3.3:1 here and fail AA, which is the rule in globals.css.
 */
export function PreviewBadge() {
  if (!IS_PREVIEW) return null;

  return (
    <div
      // aria-hidden would be wrong — this is real information about the state
      // of the site, and it matters most to someone who cannot see the styling.
      className="pointer-events-none fixed bottom-4 right-4 z-50 rounded-full bg-ink/90 px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-gold shadow-lg backdrop-blur-sm print:hidden"
    >
      Preview · sample data
    </div>
  );
}
