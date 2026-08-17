import Image from "next/image";
import { Container, Eyebrow } from "@/components/site/section";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * The marketing hero: copy on the left, a photograph holding the right and
 * dissolving into the page.
 *
 * This is the second of the site's two hero patterns, and the split is by JOB,
 * not by taste:
 *
 *   PhotoHero  — pages selling the place. Home, membership, the floor, events.
 *                A photograph is the argument, so it gets the space.
 *   CrownPage  — pages with a task or a long read. Apply, account, FAQ, the
 *                letter, staff sign-in, 404. There is nothing to photograph, so
 *                the mark holds the rail instead.
 *
 * Extracted from the homepage, which had this inline. Membership, the floor and
 * events were written before it existed and kept the older pattern — copy
 * capped at ~650px inside a 1152px container with the rest of the row empty,
 * a heading one step larger than everything else, and the photograph as a
 * separate band underneath. Three pages quietly diverging is exactly what a
 * component prevents.
 *
 * The `.hero-bleed` / `.hero-blur` stops live in globals.css.
 */
export function PhotoHero({
  eyebrow,
  title,
  children,
  photo,
  /** Which part of the frame survives the crop. */
  objectPosition = "object-center",
  /**
   * `full` fills the viewport below the navbar — for the homepage, where the
   * hero IS the page. `compact` is shorter, because every other page using this
   * has content underneath that should hint at itself above the fold.
   */
  size = "compact",
  priority = false,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  photo: PhotoData;
  objectPosition?: string;
  size?: "full" | "compact";
  priority?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-sand">
      {/*
        The Container is NOT `relative`. The photograph sits inside it in the
        DOM so it can land between the headline and the body copy on mobile, but
        on desktop it goes absolute and must resolve against the SECTION to
        reach the screen edge — a positioned Container would trap it inside the
        72rem measure. It still paints behind the text, because a `-z-10` child
        of an isolated section sits above that section's background and below
        its in-flow content.
      */}
      <Container
        className={cn(
          "pt-20 pb-20 sm:pt-28 sm:pb-24 lg:flex lg:flex-col lg:justify-center lg:py-16",
          size === "full"
            ? "lg:min-h-[calc(100svh-4rem)]"
            : "lg:min-h-[34rem]",
        )}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        {/*
          One step down from the old subpage heading. The copy is held to
          max-w-2xl so it clears the photograph's fade, and at 6xl inside that
          measure a two-word accent drops onto a third line.
        */}
        <h1 className="mt-5 max-w-2xl text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-ink sm:text-6xl lg:text-5xl xl:text-6xl">
          {title}
        </h1>

        {/*
          One element for both layouts — `relative` in flow on mobile,
          `lg:absolute` on desktop. Rendering two and hiding one per breakpoint
          would fetch the page's heaviest asset twice, because a `priority`
          image downloads even inside a `display:none` parent.

          The two overlay divs are inert below lg: their classes exist only
          inside the desktop media query, so on a phone this is just a photo.
        */}
        <div className="relative mt-10 aspect-4/3 w-full overflow-hidden rounded-xl bg-sand-deep sm:aspect-video lg:absolute lg:inset-y-0 lg:left-auto lg:right-0 lg:-z-10 lg:mt-0 lg:aspect-auto lg:h-full lg:w-[40%] lg:rounded-none lg:bg-transparent xl:w-[46%] 2xl:w-[48%]">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className={cn("object-cover", objectPosition)}
            sizes="(min-width: 1536px) 48vw, (min-width: 1280px) 46vw, (min-width: 1024px) 40vw, 100vw"
            placeholder="blur"
            priority={priority}
          />
          <div className="hero-blur pointer-events-none absolute inset-0" />
          <div className="hero-bleed pointer-events-none absolute inset-0" />
        </div>

        <div className="mt-10 max-w-xl">{children}</div>
      </Container>
    </section>
  );
}
