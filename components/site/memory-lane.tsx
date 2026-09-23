"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import * as React from "react";
import type { GalleryImage } from "@/lib/gallery";
import { Container, Eyebrow, SectionTitle } from "@/components/site/section";

/**
 * The photo wall on /since-2011 — parallax and a reveal, per photo.
 *
 * PORTED FROM THE SIBLING next-sasw REPO. Two changes: it sits on Bone rather
 * than black, so the frames take a Rule hairline and a Bone Light ground
 * instead of white-on-white transparency; and it carries a heading, because
 * on this site the wall is the page's argument rather than a coda under one.
 *
 * `motion/react` is the only animation dependency in this repo and this is the
 * only page that uses it. It earns its place here specifically: a scroll-
 * linked parallax that differs per element is the one effect the CSS the rest
 * of the site runs on cannot express — `animation-timeline: view()` has no
 * Firefox support, and an IntersectionObserver can reveal an element but
 * cannot map its offset to scroll position continuously.
 */

/*
  Deterministic per-photo values. Both hash the FILENAME rather than using an
  index or a random, for the same reason `shuffleKey` in lib/gallery.ts does:
  this page is server-rendered, and a random tilt would differ between the
  server pass and the client's, which React refuses to hydrate. Hashing also
  means a photo keeps its own tilt when the archive grows around it.
*/
function hash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h;
}
const tiltOf = (name: string) => (hash(name) % 500) / 100 - 2.5; // -2.5..2.5deg
const depthOf = (name: string) => 24 + (hash(name) % 44); // 24..68px parallax

// Columns are ~25vw (4-up) on desktop, 33vw on tablet, 50vw on phones.
const SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";
// Prioritize the first screenful so the top paints immediately.
const PRIORITY_COUNT = 8;

function Photo({ img, priority }: { img: GalleryImage; priority: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const depth = depthOf(img.name);
  const y = useTransform(scrollYProgress, [0, 1], [depth, -depth]);
  const rot = tiltOf(img.name);

  return (
    <motion.div
      ref={ref}
      style={reduce ? undefined : { y }}
      className="mb-4 break-inside-avoid sm:mb-5"
    >
      <motion.figure
        initial={reduce ? false : { opacity: 0, y: 34, scale: 0.96, rotate: rot * 1.7 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotate: reduce ? 0 : rot }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden border border-border bg-bone-light shadow-sm"
      >
        {/*
          `alt=""`, deliberately. These are decorative in the accessibility
          sense — a wall of fifteen years of event photography where no single
          frame carries information the page depends on, and where the
          filenames are camera exports rather than descriptions. Hundreds of
          machine-written alt strings would be noise for a screen reader; the
          section heading says what the wall is.
        */}
        <Image
          src={img.url}
          alt=""
          width={img.width}
          height={img.height}
          sizes={SIZES}
          placeholder={img.blurDataURL ? "blur" : "empty"}
          blurDataURL={img.blurDataURL || undefined}
          priority={priority}
          className="h-auto w-full"
        />
      </motion.figure>
    </motion.div>
  );
}

export function MemoryLane({ images }: { images: GalleryImage[] }) {
  return (
    <section className="bg-bone pb-28 pt-4">
      <Container>
        <div className="mb-14">
          <Eyebrow>Down memory lane</Eyebrow>
          <SectionTitle>Everyone who showed up.</SectionTitle>
        </div>

        {/*
          CSS columns, not a grid. The photographs are every aspect ratio a
          fifteen-year archive contains — phone verticals, panorama crops,
          square exports — and a grid would either crop them all to one shape
          or leave ragged holes. Columns let each frame keep its own height and
          the wall fill itself, which is the whole point of a masonry layout.
        */}
        <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
          {images.map((img, i) => (
            <Photo key={img.name} img={img} priority={i < PRIORITY_COUNT} />
          ))}
        </div>
      </Container>
    </section>
  );
}
