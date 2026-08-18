import { Container, Eyebrow, SectionTitle } from "@/components/site/section";
import { MOCK_MEMBER_VOICES as MEMBER_VOICES } from "@/data/mock/voices";

/**
 * What members say, in their own words and under their own names.
 *
 * The pattern is Vercel's "Hear from teams building on…": a two-column grid of
 * cells divided by hairlines, each one a quotation with the person's name and
 * role beneath it. It works because it is unglamorous — no cards, no portraits,
 * no carousel. The quote is the content and the attribution is the proof.
 *
 * Renders nothing when MEMBER_VOICES is empty. The quotes there are mock
 * content for layout review — see the note in lib/site.ts.
 *
 * Two columns rather than three: these are sentences, and a third column drops
 * the measure to about forty characters, at which point a two-line quote breaks
 * across four lines and stops reading as speech.
 */
export function MemberVoices() {
  if (MEMBER_VOICES.length === 0) return null;

  return (
    /*
      SAND, not white. "How it works" directly below is white, and two white
      bands in a row merge into one long section however good the hairline
      between them is — the page loses a beat exactly where it should be
      changing subject.
    */
    <section className="border-y border-border bg-sand py-20 sm:py-28">
      <Container>
        <Eyebrow>In their words</Eyebrow>
        <SectionTitle>Hear from the people in the room.</SectionTitle>

        {/*
          The dividers are drawn on the CELLS, not the grid, because a CSS grid
          has no elements between its tracks to draw on. Every cell takes a top
          border and the second column takes a left one; the first row's top
          border is suppressed so the block opens with the section's own rule
          rather than doubling it.
        */}
        {/*
          mt-6, the same gap every other section puts between its heading and
          whatever follows — a photo, a paragraph block or, here, the grid. This
          is the one section with no lede, and it had drifted to 56px on that
          basis; the section padding is what provides air, not a bespoke gap.
        */}
        <ul className="mt-6 grid sm:grid-cols-2">
          {MEMBER_VOICES.map((voice, i) => (
            <li
              key={voice.quote}
              className={[
                "flex flex-col justify-between gap-8 border-t border-border py-10 sm:py-12",
                i % 2 === 0 ? "sm:pr-12" : "sm:border-l sm:pl-12",
                i < 2 ? "sm:first:border-t-0 sm:[&:nth-child(2)]:border-t-0" : "",
              ].join(" ")}
            >
              <blockquote className="text-lg leading-relaxed text-ink/85">
                {/* A real typographic quotation mark, sized down and dimmed —
                    it marks the block as speech without shouting. */}
                <span
                  aria-hidden="true"
                  className="mr-1 font-mono text-2xl leading-none text-rust/40"
                >
                  &ldquo;
                </span>
                {voice.quote}
              </blockquote>
              <figcaption className="not-italic">
                <p className="font-semibold text-ink">{voice.name}</p>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {voice.role}
                </p>
              </figcaption>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
