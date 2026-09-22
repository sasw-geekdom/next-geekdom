import type { MemberVoice } from "@/lib/site";
import { Container, Eyebrow, SectionTitle } from "@/components/site/section";
import { MOCK_MEMBER_VOICES } from "@/data/mock/voices";
import { cn } from "@/lib/utils";

/**
 * What members say, in their own words and under their own names.
 *
 * The pattern is Vercel's "Hear from teams building on…": a two-column grid of
 * cells divided by hairlines, each one a quotation with the person's name and
 * role beneath it. It works because it is unglamorous — no cards, no portraits,
 * no carousel. The quote is the content and the attribution is the proof.
 *
 * Renders nothing when the list is empty. The quotes live in
 * data/mock/voices.ts and both lists there are empty until they are real —
 * see the note in that file.
 *
 * TAKES ITS LIST AND ITS HEADING AS PROPS, because /studio needs the same
 * grid for founder quotes. It was hardwired to the member list and its own
 * two lines of copy; the alternative was a second component that is this one
 * with three strings changed, and the strings are not the part with the
 * value. Defaults keep the homepage's call a bare <MemberVoices />.
 *
 * Two columns rather than three: these are sentences, and a third column drops
 * the measure to about forty characters, at which point a two-line quote breaks
 * across four lines and stops reading as speech.
 */
export function MemberVoices({
  voices = MOCK_MEMBER_VOICES,
  eyebrow = "In their words",
  title = "Hear from the people in the room.",
  /**
   * Bone by default, for the homepage's neighbour. A caller whose preceding
   * section is already Bone passes `bone-light` — six points of luminance
   * will not separate two same-tone bands, and this one draws its own top
   * border, which is not enough on its own.
   */
  tone = "bone",
}: {
  voices?: readonly MemberVoice[];
  eyebrow?: string;
  title?: string;
  tone?: "bone" | "bone-light";
}) {
  if (voices.length === 0) return null;

  return (
    /*
      SAND, not white. "How it works" directly below is white, and two white
      bands in a row merge into one long section however good the hairline
      between them is — the page loses a beat exactly where it should be
      changing subject.
    */
    <section
      className={cn(
        "border-y border-border py-20 sm:py-28",
        tone === "bone" ? "bg-bone" : "bg-bone-light",
      )}
    >
      <Container>
        <Eyebrow>{eyebrow}</Eyebrow>
        <SectionTitle>{title}</SectionTitle>

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
          {voices.map((voice, i) => (
            <li
              key={voice.quote}
              className={[
                "flex flex-col justify-between gap-8 border-t border-border py-10 sm:py-12",
                i % 2 === 0 ? "sm:pr-12" : "sm:border-l sm:pl-12",
                i < 2 ? "sm:first:border-t-0 sm:[&:nth-child(2)]:border-t-0" : "",
              ].join(" ")}
            >
              <blockquote className="text-lg leading-relaxed text-graphite/85">
                {/* A real typographic quotation mark, sized down and dimmed —
                    it marks the block as speech without shouting. */}
                <span
                  aria-hidden="true"
                  className="mr-1 font-mono text-2xl leading-none text-clay/60"
                >
                  &ldquo;
                </span>
                {voice.quote}
              </blockquote>
              <figcaption className="not-italic">
                <p className="font-medium text-graphite">{voice.name}</p>
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
