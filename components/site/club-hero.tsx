import Image from "next/image";
import { Container, Eyebrow, HEADING } from "@/components/site/section";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * /club's hero, as a SPREAD: the headline at display size on Bone, then the
 * photograph full-bleed beneath it, running past the fold. No gradient.
 *
 * Geekdom on the TypeHero version this replaced: "I don't like this gradient
 * treatment and the short header. It feels too basic. Not editorial enough.
 * Maybe make it fill to the bottom of the page?" That hero was a 450px band
 * with a scrim ramp across the photograph — the ramp kept the type legible
 * and made the picture read as a dimmed background. Here the type never sits
 * on the picture, so the picture keeps every value it has.
 *
 * A "cover" variant — the photograph filling the fold with the headline in a
 * solid block at the bottom-left — was built and compared, and lost: on a
 * 1440 laptop the block landed on the speaker, the one person the frame is
 * about, and there is no horizontal slack in the crop to move him out.
 *
 * THE PHOTOGRAPH IS SIZED FROM ITS OWN SHAPE, NOT FROM THE SPACE LEFT OVER.
 * The first cut gave it whatever the fold had left under the headline, which
 * on a MacBook Air was a ~3:1 strip and on a large monitor thinner still —
 * slicing the room through heads and hands. Now it is its natural 3:2 at the
 * full width (`66.667vw`), capped at 88svh so a wide screen still sees the
 * headline and most of the picture at once. Worst case (2560 wide) that is
 * about 2.2:1, keeping ~two-thirds of the frame's height; a phone gets the
 * whole frame. It always reaches the bottom of the fold and carries on past
 * it, so the fold never lands on a seam.
 *
 * Nothing overlaps the photograph and nothing fades it: the section after
 * it (/club's Opening) makes the transition in type — see the note there.
 */
export function ClubHero({
  eyebrow,
  title,
  photo,
  objectPosition,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  photo: PhotoData;
  /** Tailwind `object-[x_y]` class — which part of the frame survives. */
  objectPosition?: string;
}) {
  return (
    <section className="bg-bone">
      <Container className="pt-14 pb-10 sm:pt-20 sm:pb-12">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          className={cn(
            "mt-6 max-w-5xl text-balance text-graphite",
            HEADING.display,
          )}
        >
          {title}
        </h1>
      </Container>
      <div className="relative h-[min(66.667vw,88svh)] bg-graphite">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className={cn("object-cover", objectPosition ?? "object-center")}
        />
      </div>
    </section>
  );
}
