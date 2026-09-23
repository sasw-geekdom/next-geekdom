"use client";

import { useState } from "react";
import Image from "next/image";
import { HEADING, MONO } from "@/components/site/section";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A YouTube film, embedded only once somebody asks for it.
 *
 * THE FIRST THIRD-PARTY EMBED ON THIS SITE, and it is built the careful way
 * because of it. Nothing from Google is requested until the button is pressed:
 * no iframe, no player script, no cookie, no image. A plain YouTube embed
 * pulls roughly a megabyte and sets identifiers on every visitor who scrolls
 * past — on a page where the LCP is already a full-bleed hero photograph, that
 * is a real cost paid by everyone to serve the few who watch.
 *
 * `youtube-nocookie.com` for the same reason, and `rel=0` so the end card
 * offers this channel rather than whatever the algorithm has to hand.
 *
 * ── A ROW, NOT A CARD, AND THIS IS THE THIRD ATTEMPT ──────────────────────
 *
 * YOUTUBE'S OWN THUMBNAIL IS NOT THE POSTER, deliberately. For this film it
 * is a designed one — heavy condensed caps, a dot-matrix field, and
 * large blocks in #AA2D29, which is neither Geekdom Red (#CA3625) nor Clay
 * (#C8623D) and covers 20% of the frame, measured. On a page built from five
 * colors and "Never Bold" that is a fourth red and a typeface the guide does
 * not have, at the largest size in the section. YouTube's auto-generated
 * frames are brand-neutral but top out at 480x360, too small for a 16:9 slot
 * at any width here.
 *
 * THE FIRST TWO VERSIONS BOTH TRIED TO BE A CARD ANYWAY, and a card with no
 * poster is a black rectangle:
 *
 *   1. Label and title INSIDE a full-width 16:9 graphite panel. On a phone
 *      that panel is 192px tall, `p-8` left 128px, and a ring plus a label
 *      plus a three-line title needs ~200px — so `overflow-hidden` clipped
 *      the play button off the top. Capped at 34rem to stop it becoming a
 *      612px slab, it left half the measure empty on a laptop.
 *   2. Panel holding only a centred ring, title beside it. That fixed the
 *      geometry at both ends and was still a 416x234 void with a small circle
 *      in the middle — a widget bolted onto the page rather than part of it.
 *
 * THE PORTRAIT IS THE POSTER, and it is the answer the two card versions were
 * reaching for. The reason there was no image is that YouTube's frame is off
 * brand; the reason that mattered is that a film with no image is a black
 * rectangle. A photograph of the person doing the talking is neither — it is
 * on palette, it is a real named person, and for an interview it is a more
 * honest poster than a still of a chair. It is cropped to a square at 64px
 * with a Clay play badge, so the row still reads as something to press.
 *
 * SO IT STOPPED BEING A CARD. This page's dominant idiom is the hairline row:
 * the terms, the investment criteria, "what comes with it", the portfolio
 * wall. The film is supporting evidence in a section about four companies,
 * not the section's subject, so it takes that idiom — a rule, the speaker's
 * face, a mono label and the title. Nothing to clip and no width to waste.
 *
 * THE PLAYER APPEARS ABOVE THE ROW when pressed, and the row stays as its
 * caption. 16:9 is a property of the video, so it only exists once the video
 * does.
 *
 * THE WHOLE ROW IS THE TARGET, which is `PortfolioWall`'s rule and it applies
 * here: the row IS the link. That is also why the title takes the hover
 * underline — unlike the partner rows, this line is the thing's name rather
 * than a descriptor of it.
 *
 * THE TITLE IS QUOTED VERBATIM from the YouTube oEmbed endpoint. It is
 * somebody else's headline on somebody else's platform; paraphrasing it into
 * Geekdom's voice would make the row a claim rather than a link.
 */
export function VideoCard({
  id,
  title,
  label,
  portrait,
  className,
}: {
  /** The YouTube video id. */
  id: string;
  /** The film's own title, as published. */
  title: string;
  /** What this is — "Geekdom film · Franklin Morris, KeepTabz". Scanned, so
      mono. */
  label: string;
  /**
   * The speaker, used as the poster in place of a still.
   *
   * Optional: a film whose subject has no portrait falls back to the plain
   * Clay ring rather than borrowing somebody else's face or reaching for
   * YouTube's thumbnail.
   */
  portrait?: PhotoData;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  const text = (
    <span className="block">
      <span className={cn("block", MONO.label, "text-muted-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "mt-2 block max-w-2xl text-graphite decoration-clay decoration-2 underline-offset-4 group-hover:underline",
          HEADING.item,
        )}
      >
        {title}
      </span>
    </span>
  );

  return (
    <div className={className}>
      {playing && (
        /*
          THE FULL CONTENT WIDTH, at Geekdom's request — the player matches
          the portfolio grid above it edge to edge (1088px at most, so 612px
          tall). It was capped at 46rem so it wouldn't outrank the logo wall;
          once someone has pressed play, the film is the point. Square
          corners, like `Photo`.
        */
        <div className="relative mb-8 aspect-video overflow-hidden bg-graphite">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {playing ? (
        /* Once it is playing the row is a caption, so it loses the control
           and the ring's space with it. */
        <div className="border-t border-border pt-6">{text}</div>
      ) : (
        /*
          A <button>, not a link. It does not navigate — it reveals the player
          in place — and a link that goes nowhere is the more common version
          of this component and the wrong one.
        */
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play the film: ${title}`}
          className="group flex w-full items-center gap-5 border-t border-border pt-6 text-left transition-colors hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay sm:gap-6"
        >
          {portrait ? (
            <span
              aria-hidden="true"
              className="relative size-16 shrink-0"
            >
              <Image
                src={portrait.src}
                alt=""
                fill
                sizes="64px"
                className="object-cover object-top ring-1 ring-clay/40"
              />
              {/*
                The badge sits ON the portrait's lower-right, offset out by a
                few pixels so it reads as attached rather than contained.
                Bone triangle on Clay: at 10px a Clay glyph on any ground
                fails, and this is the one place the accent carries something
                small — so the accent becomes the FILL and the mark on it is
                Bone, which is the same move the guide prescribes for text.
              */}
              <span className="absolute -bottom-0.5 -right-0.5 flex size-6 items-center justify-center rounded-full bg-clay ring-2 ring-bone-light transition-colors group-hover:bg-geekdom-red">
                <svg viewBox="0 0 24 24" className="ml-px size-3 fill-bone">
                  <path d="M8 5l11 7-11 7V5z" />
                </svg>
              </span>
            </span>
          ) : (
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full border border-clay transition-colors group-hover:bg-clay/20"
            >
              {/* Optically centred: a triangle's visual centre sits left of
                  its bounding box, so it needs a nudge right to look
                  centred. */}
              <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-clay">
                <path d="M8 5l11 7-11 7V5z" />
              </svg>
            </span>
          )}
          {text}
        </button>
      )}
    </div>
  );
}
