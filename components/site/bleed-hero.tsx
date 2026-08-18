import Image from "next/image";
import { Container, Eyebrow, HEADING } from "@/components/site/section";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * The photograph IS the hero. Full bleed, type centred over it.
 *
 * Replaces the copy-left/photo-right split that every page used to run. That
 * split failed for a structural reason, not a stylistic one: every photograph
 * here is a landscape group shot, and cropping one into a tall panel at ~44%
 * width severs the group that is the entire argument. The standing member was
 * cut by the viewport edge on the homepage; a seated member was cut in half by
 * the fade on /membership. Full bleed keeps the frame the photographer shot,
 * and disposes of the milky vertical seam where the old blur met the sand.
 *
 * Pairs with TypeHero, and the split is by JOB:
 *
 *   BleedHero — pages selling the ROOM. Home, the floor, events.
 *   TypeHero  — pages making a CLAIM or carrying a task. Membership.
 *
 * ACCENTS MUST BE GOLD HERE. This is an ink ground: rust measures 3.3:1 against
 * it and fails AA, gold is 9.3:1. Callers pass their own accent span, so this
 * is the one rule a caller can break — see the note on `title`.
 */
export function BleedHero({
  eyebrow,
  title,
  children,
  photo,
  /**
   * Which part of the frame survives the crop, per breakpoint.
   *
   * Worth setting per page. A landscape file in a portrait phone viewport loses
   * most of its width, so a subject standing off-centre needs anchoring toward
   * their side or they are simply cropped out — which is the failure the old
   * hero had, just in the other axis.
   */
  objectPosition = "object-center",
  /** `full` fills the viewport below the navbar; `compact` leaves the next section hinting. */
  size = "compact",
  priority = false,
}: {
  eyebrow: React.ReactNode;
  /** Accent spans inside this must use `text-gold`, never `text-rust`. */
  title: React.ReactNode;
  children: React.ReactNode;
  photo: PhotoData;
  objectPosition?: string;
  size?: "full" | "compact";
  priority?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative isolate flex flex-col justify-center overflow-hidden bg-ink",
        size === "full"
          ? "min-h-[calc(100svh-4rem)]"
          : "min-h-[30rem] sm:min-h-[34rem] lg:min-h-[38rem]",
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        placeholder="blur"
        className={cn("object-cover", objectPosition)}
        sizes="100vw"
      />

      {/*
        Three layers, and the split is what keeps this out of the reference
        site's murk — theirs darkens the whole frame until the faces disappear,
        which defeats the point when the people ARE the argument.

        The type sits bottom-LEFT, so the second gradient runs horizontally: it
        darkens the column the words occupy and leaves the right side of the
        room lit. A single scrim heavy enough to carry gold type over a bright
        back wall would have to dim everything.

        NO `-z-10` ON THESE. A `fill` image is itself absolutely positioned, so
        a scrim sent to -z-10 lands BEHIND the photograph and does nothing —
        and it doesn't necessarily look broken, because a frame with a dark
        corner reads like a working scrim. The tell is light accent type
        washing out. Being later siblings is what puts them on top; the
        Container after them is `relative`, so the type stays above both.
      */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/35 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-ink/10" aria-hidden="true" />

      {/*
        CENTRED, not bottom-anchored. The type used to sit at the foot of the
        frame, which reads as a caption on a short hero and strands the copy at
        the very bottom of the screen on a tall one — the taller the display,
        the further it fell. Centring holds it in the same place on every
        screen, and the scrim below is what keeps it legible either way.
      */}
      <Container className="relative py-20">
        <Eyebrow onInk>{eyebrow}</Eyebrow>
        <h1 className={cn("mt-6 max-w-4xl text-white", HEADING.title)}>
          {title}
        </h1>
        <div className="mt-8 max-w-xl">{children}</div>
      </Container>
    </section>
  );
}
