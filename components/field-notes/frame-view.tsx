"use client";

import * as React from "react";
import { FRAUNCES_VARIABLE } from "@/components/site/editorial";
import { RichText } from "@/components/field-notes/rich-text";
import { cn } from "@/lib/utils";
import type { Frame, NoteImage } from "@/lib/field-notes/types";

/*
  ONE FRAME OF A FIELD NOTE — the 4:5 panel, in all five kinds.

  Shared by the reader (the preview now, the public page later), the
  editor's canvas and the filmstrip, so every place shows the same frame.
  `still` renders it non-interactive (filmstrip thumbnails: no players, no
  links to tab into).

  Type is in `cqw` (globals.css, `.fn-frame`), so a frame is the same
  composition at any width. Photographs are square-cornered and arrive
  already graded. Video from YouTube or Vimeo is a click-to-load facade —
  nothing is requested from either until someone presses play, the same
  rule as /studio's film (components/site/video-card.tsx).
*/

const MONO = "font-mono uppercase tracking-[0.18em]";

function Photo({ image, fit = "cover", className }: { image: NoteImage; fit?: "cover" | "contain"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- already sized WebPs on Blob, with srcSet
    <img
      src={image.srcSm}
      srcSet={`${image.srcSm} 1200w, ${image.src} 2400w`}
      sizes="(min-width: 1024px) 40vw, 90vw"
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading="lazy"
      className={cn("h-full w-full", fit === "contain" ? "object-contain" : "object-cover", className)}
    />
  );
}

function Empty({ label, dark }: { label: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center border-2 border-dashed p-[8cqw] text-center",
        dark ? "border-bone/25 text-bone/60" : "border-border text-muted-foreground",
      )}
    >
      <span className={cn(MONO, "text-[3cqw]")}>{label}</span>
    </div>
  );
}

function PlayMark() {
  return (
    <span aria-hidden="true" className="flex size-[16cqw] items-center justify-center rounded-full bg-clay ring-[1cqw] ring-bone/30">
      <svg viewBox="0 0 24 24" className="ml-[0.6cqw] size-[6cqw] fill-bone">
        <path d="M8 5l11 7-11 7V5z" />
      </svg>
    </span>
  );
}

function VideoFrame({ frame, still }: { frame: Extract<Frame, { type: "video" }>; still: boolean }) {
  const [playing, setPlaying] = React.useState(false);
  const v = frame.video;
  if (!v) return <Empty label="Add a video" dark />;

  const poster = frame.poster ? <Photo image={frame.poster} /> : null;
  const label = frame.caption || "this video";

  if (v.source === "upload") {
    if (still) return <div className="relative h-full w-full bg-graphite">{poster}<span className="absolute inset-0 flex items-center justify-center"><PlayMark /></span></div>;
    return v.loop ? (
      <video src={v.url} poster={frame.poster?.srcSm} autoPlay muted loop playsInline aria-label={label} className="h-full w-full object-cover" />
    ) : (
      <video src={v.url} poster={frame.poster?.srcSm} controls playsInline preload="metadata" aria-label={label} className="h-full w-full bg-graphite object-contain" />
    );
  }

  if (playing && !still) {
    const src =
      v.source === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`
        : `https://player.vimeo.com/video/${v.id}?autoplay=1&dnt=1`;
    return (
      <div className="flex h-full w-full items-center bg-graphite">
        <iframe
          src={src}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }

  const face = (
    <>
      {poster ?? <span className="absolute inset-0 bg-graphite" />}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-[4cqw] p-[8cqw] text-center">
        <PlayMark />
        {!poster && (
          <span className={cn(MONO, "text-[2.8cqw] text-bone/70")}>{v.source === "youtube" ? "YouTube" : "Vimeo"}</span>
        )}
      </span>
    </>
  );
  return still ? (
    <div className="relative h-full w-full">{face}</div>
  ) : (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${label}`}
      className="relative block h-full w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-clay"
    >
      {face}
    </button>
  );
}

export function FrameView({
  frame,
  still = false,
  className,
  children,
}: {
  frame: Frame;
  /** Non-interactive (filmstrip). */
  still?: boolean;
  className?: string;
  /** Replaces the text frame's body — the editor's in-place Tiptap. */
  children?: React.ReactNode;
}) {
  const ground = "ground" in frame ? frame.ground : frame.type === "video" ? "graphite" : "bone";
  const dark = ground === "graphite";
  const muted = dark ? "text-bone/70" : "text-muted-foreground";

  let body: React.ReactNode;
  switch (frame.type) {
    case "cover":
      body = (
        <div className="flex h-full flex-col">
          {frame.image && (
            <div className="h-[58%] shrink-0">
              <Photo image={frame.image} />
            </div>
          )}
          <div className={cn("flex flex-1 flex-col p-[8cqw]", frame.image ? "justify-start" : "justify-end border-t-[1.4cqw] border-clay")}>
            <p className={cn(MONO, "text-[2.8cqw]", muted)}>Field Notes</p>
            {/* Line-height AFTER the size: tailwind-merge drops a `leading-*`
                that comes before a `text-*` size, as it did here once. */}
            <h2
              className={cn(
                "mt-[3cqw] font-medium tracking-[-0.025em]",
                frame.image ? "text-[8.4cqw]" : "text-[11cqw]",
                "leading-[1.02]",
                !frame.title && "opacity-40",
              )}
            >
              {frame.title || "Your title"}
            </h2>
            {frame.dek && <p className={cn("mt-[3cqw] text-[4.2cqw] leading-[1.4]", muted)}>{frame.dek}</p>}
          </div>
        </div>
      );
      break;
    case "text":
      body = <div className="fn-rich h-full p-[8cqw]">{children ?? <RichText doc={frame.doc} />}</div>;
      break;
    case "image":
      body = frame.image ? (
        <div className={cn("flex h-full flex-col", frame.fit === "contain" && "bg-bone")}>
          <div className="min-h-0 flex-1">
            <Photo image={frame.image} fit={frame.fit} />
          </div>
          {frame.caption && (
            <p className={cn(MONO, "shrink-0 bg-bone px-[6cqw] py-[3.5cqw] text-[2.7cqw] leading-[1.5] text-muted-foreground")}>
              {frame.caption}
            </p>
          )}
        </div>
      ) : (
        <Empty label="Add a photo" />
      );
      break;
    case "quote":
      body = (
        <figure className="flex h-full flex-col justify-center p-[10cqw]">
          <blockquote
            className={cn(
              "border-l-[0.8cqw] border-clay pl-[5cqw] text-[7.6cqw] leading-[1.25]",
              !frame.text && "opacity-40",
            )}
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}
          >
            {frame.text ? `“${frame.text}”` : "A line worth keeping."}
          </blockquote>
          {frame.attribution && (
            <figcaption className={cn(MONO, "mt-[6cqw] pl-[5.8cqw] text-[2.8cqw]", muted)}>— {frame.attribution}</figcaption>
          )}
        </figure>
      );
      break;
    case "video":
      body = (
        <div className="flex h-full flex-col bg-graphite">
          <div className="relative min-h-0 flex-1">
            <VideoFrame frame={frame} still={still} />
          </div>
          {frame.caption && (
            <p className={cn(MONO, "shrink-0 px-[6cqw] py-[3.5cqw] text-[2.7cqw] leading-[1.5] text-bone/70")}>{frame.caption}</p>
          )}
        </div>
      );
      break;
  }

  return (
    <div
      data-ground={ground}
      className={cn("fn-frame", FRAUNCES_VARIABLE, still && "pointer-events-none select-none", className)}
    >
      {body}
    </div>
  );
}
