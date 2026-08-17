import Image from "next/image";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A photograph running the full width of the page, landscape intact.
 *
 * The counterweight to TypeHero. Type-led pages give up the image above the
 * fold, and this is where it comes back — deliberately the FIRST thing under
 * the hero, so the claim is answered by the room immediately rather than after
 * a screen of feature copy.
 *
 * Edge to edge on purpose. Every photograph here is a wide group shot; putting
 * one inside the 72rem measure would reintroduce the crop that made the old
 * split hero fail, just in a shorter box. A wide aspect and the full viewport
 * width is the shape these frames were actually taken in.
 *
 * The aspect steps rather than staying fixed: a 3:1 letterbox is right on a
 * desktop where the width is there to fill, and wrong on a phone, where it
 * would reduce a room full of people to a slot.
 */
/**
 * Grounds the fade can land on. Written as whole literal class strings because
 * Tailwind scans source text — a composed `to-${tone}` would never be emitted.
 */
const FADE_TO = {
  ink: "to-ink",
  sand: "to-sand",
  white: "to-white",
  "sand-deep": "to-sand-deep",
} as const;

export function PhotoBand({
  photo,
  /**
   * Desktop aspect. Default 3:1 is a letterbox that suits a wide room shot; a
   * frame closer to 3:2 needs something taller, or half its height is thrown
   * away and the crop starts taking heads off.
   */
  aspect = "lg:aspect-[3/1]",
  /**
   * Fades the bottom of the frame into the section that follows.
   *
   * A full-bleed photograph meeting a coloured band edge-to-edge draws a hard
   * horizontal rule across the page, and the eye reads that line as the end of
   * the page rather than as one section becoming the next. MUST match the tone
   * of whatever comes after it, or the fade resolves to the wrong colour and
   * the seam gets worse rather than better.
   */
  fadeTo,
  className,
  priority = false,
}: {
  photo: PhotoData;
  aspect?: string;
  fadeTo?: keyof typeof FADE_TO;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-4/3 w-full overflow-hidden bg-sand-deep sm:aspect-video",
        aspect,
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        placeholder="blur"
        className="object-cover"
        sizes="100vw"
      />

      {/*
        Two things matter here and they pull against each other.

        The fade has to be LONG enough that the eye never finds an edge — a
        short one just moves the hard line up a few pixels. But it also has to
        stay off the middle of the frame, which is where the faces are, so most
        of the travel is weighted low: nothing until 25%, then all the way to
        solid by 92%.

        Solid BEFORE the boundary, not at it. Ending the gradient at 100% means
        the frame only reaches the section's colour on its final row of pixels,
        which leaves exactly the faint seam this exists to remove. The last 8%
        is flat colour, so the photograph has already become the next section by
        the time it gets there.
      */}
      {fadeTo && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-b from-transparent from-25% to-92%",
            FADE_TO[fadeTo],
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
