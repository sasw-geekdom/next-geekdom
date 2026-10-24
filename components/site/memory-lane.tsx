"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import * as React from "react";
import type { GalleryImage } from "@/lib/gallery";
import { Container, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

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

function Photo({
  img,
  priority,
  label,
  onOpen,
}: {
  img: GalleryImage;
  priority: boolean;
  label: string;
  onOpen: () => void;
}) {
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
        {/* Every frame opens the viewer — a wall you can't look into was the
            page's biggest gap for the people who are in these photos. */}
        <button
          type="button"
          onClick={onOpen}
          aria-label={label}
          className="block w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay"
        >
          <Image
            src={img.url}
            alt=""
            width={img.width}
            height={img.height}
            sizes={SIZES}
            placeholder={img.blurDataURL ? "blur" : "empty"}
            blurDataURL={img.blurDataURL || undefined}
            priority={priority}
            className="h-auto w-full transition-opacity hover:opacity-90"
          />
        </button>
      </motion.figure>
    </motion.div>
  );
}

/*
  THE PHOTO VIEWER — one photograph at a time, as large as the screen allows.

  A native <dialog>, the same reasoning as the admin's drawer: showModal()
  gives the top layer, focus containment, Escape, and focus back on the
  frame you opened when it closes — none of it hand-rolled. Graphite, edge
  to edge, because a photo reads best on the dark ground and the brand has
  one. ← / → (and the on-screen chevrons) walk the wall in its order; a
  click anywhere that isn't the photo or a control closes it.

  It shows `large` — the sync's 1800px copy, same grade as the thumbnail —
  and falls back to the thumbnail for anything synced before that existed.
  The neighbors are fetched ahead so stepping through doesn't wait.

  `data-lenis-prevent`: the page's scroll glide listens on the window, and
  without it a wheel over the viewer would scroll the wall behind it.
*/
function Viewer({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: GalleryImage[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const open = index !== null;
  const n = images.length;

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Warm the cache for the photos either side.
  React.useEffect(() => {
    if (index === null) return;
    for (const d of [1, -1]) {
      const img = images[(index + d + n) % n];
      new window.Image().src = img.large?.url ?? img.url;
    }
  }, [index, images, n]);

  const step = (d: number) => index !== null && onIndex((index + d + n) % n);
  // Swipe on touch screens: a mostly-horizontal drag of 50px or more.
  const touch = React.useRef<{ x: number; y: number } | null>(null);
  const img = index !== null ? images[index] : null;
  const src = img?.large ?? img;

  const control =
    "flex h-12 w-12 items-center justify-center text-bone/80 transition-colors hover:bg-bone/10 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay";

  return (
    <dialog
      ref={ref}
      data-lenis-prevent
      aria-label="Photo viewer"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
      onClick={(e) => {
        // Only the empty ground closes it, not the photo or a control.
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.ground) onClose();
      }}
      className="lightbox m-0 h-svh max-h-none w-screen max-w-none bg-graphite p-0 text-bone"
    >
      {img && src && (
        <div data-ground="1" className="relative flex h-full flex-col">
          <div className="flex items-center justify-between px-3 py-2 sm:px-5">
            <p className={cn(MONO.label, "pl-2 text-bone/70")} aria-live="polite">
              {index! + 1} / {n}
            </p>
            <button type="button" onClick={onClose} aria-label="Close" className={control}>
              <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>

          <div
            data-ground="1"
            onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
            onTouchEnd={(e) => {
              const t = touch.current;
              touch.current = null;
              if (!t) return;
              const dx = e.changedTouches[0].clientX - t.x;
              const dy = e.changedTouches[0].clientY - t.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
            }}
            className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-20 sm:pb-6"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- already a sized WebP on Blob */}
            <img
              key={src.url}
              src={src.url}
              width={src.width}
              height={src.height}
              alt={`Photo ${index! + 1} of ${n} from Geekdom's archive`}
              style={{ backgroundImage: `url(${img.blurDataURL})`, backgroundSize: "cover" }}
              className="max-h-full w-auto max-w-full object-contain"
            />
          </div>

          {/*
            Beside the photo from sm up; on a phone, in a row under it, where
            a thumb reaches and they don't sit on the picture's edges.
          */}
          <div data-ground="1" className="flex justify-center gap-6 py-3 sm:contents">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className={cn(control, "sm:absolute sm:left-4 sm:top-1/2 sm:-translate-y-1/2")}
            >
              <ChevronLeft aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className={cn(control, "sm:absolute sm:right-4 sm:top-1/2 sm:-translate-y-1/2")}
            >
              <ChevronRight aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export function MemoryLane({ images }: { images: GalleryImage[] }) {
  const [open, setOpen] = React.useState<number | null>(null);
  return (
    <section className="bg-bone pb-28 pt-4">
      <Container>
        {/*
          The wall's heading is for screen readers only. Visible, it put
          213px between the hero and the first photograph — the hero's
          Fraunces line already introduces the wall — and the page opened on
          no photos at all. It stays a real <h2> so the outline is intact.
        */}
        <h2 className="sr-only">Everyone who showed up.</h2>

        {/*
          CSS columns, not a grid. The photographs are every aspect ratio a
          fifteen-year archive contains — phone verticals, panorama crops,
          square exports — and a grid would either crop them all to one shape
          or leave ragged holes. Columns let each frame keep its own height and
          the wall fill itself, which is the whole point of a masonry layout.
        */}
        <div className="columns-2 gap-4 sm:columns-3 sm:gap-5 lg:columns-4">
          {images.map((img, i) => (
            <Photo
              key={img.name}
              img={img}
              priority={i < PRIORITY_COUNT}
              label={`Open photo ${i + 1} of ${images.length}`}
              onOpen={() => setOpen(i)}
            />
          ))}
        </div>
      </Container>
      <Viewer images={images} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
    </section>
  );
}
