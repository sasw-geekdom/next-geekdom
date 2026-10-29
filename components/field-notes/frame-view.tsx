"use client";

import * as React from "react";
import { FRAUNCES_VARIABLE } from "@/components/site/editorial";
import { RichText } from "@/components/field-notes/rich-text";
import { isExternal } from "@/lib/field-notes/schemas";
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
      {/* With a poster the button sits bottom-left, off the picture's subject
          (centered, it landed on the speaker's face); without one, centered
          on the plain card. */}
      <span
        className={cn(
          "absolute inset-0 flex flex-col gap-[4cqw] p-[8cqw]",
          poster ? "items-start justify-end" : "items-center justify-center text-center",
        )}
      >
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

/** "https://www.lorenzo.com/about" → "lorenzo.com". */
function linkLabel(href: string): string {
  if (href.startsWith("mailto:")) return href.slice(7);
  try {
    return new URL(href, "https://geekdom.com").hostname.replace(/^www\./, "") + (href.startsWith("/") ? href : "");
  } catch {
    return href;
  }
}

/*
  THE FIELD NOTES SIGN-OFF — a lockup, not a new logo: the existing Geekdom
  wordmark, a hairline, and "FIELD NOTES" in Plex Mono, the pattern the
  member portal's top bar already uses ("geekdom │ MEMBER PORTAL"). The guide
  gives Geekdom one wordmark, so Field Notes gets a lockup of it rather than
  a mark of its own. Red on Bone, Bone on Graphite and photos — the only
  colors the mark may take. Bottom-right of every frame that isn't a photo
  or a video (it would sit on someone's picture). Decorative: the page says
  what it is.
*/
export function Lockup({ dark }: { dark: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-[6cqw] right-[6cqw] flex items-center gap-[1.8cqw]">
      <span className={cn("geekdom-mask block aspect-375/142 h-[4.6cqw]", dark ? "bg-bone" : "bg-geekdom-red")} />
      <span className={cn("h-[3.2cqw] w-px", dark ? "bg-bone/40" : "bg-graphite/25")} />
      <span className={cn(MONO, "text-[2cqw]", dark ? "text-bone/80" : "text-muted-foreground")}>Field Notes</span>
    </div>
  );
}

export function FrameView({
  frame,
  still = false,
  draft = false,
  className,
  children,
}: {
  frame: Frame;
  /** Non-interactive (filmstrip). */
  still?: boolean;
  /**
   * The editor's canvas: show placeholders for what's missing ("Add a
   * portrait", "Name"). Off everywhere a reader can see — the public page
   * and the admin preview — where a missing portrait is simply left out.
   */
  draft?: boolean;
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
      body =
        frame.layout === "full" ? (
          /*
            FULL-BLEED: the photo edge to edge, the type over a Graphite scrim
            — the reference carousels' cover. `fn-drift` is the one scroll
            effect: on the note page the photo moves a little slower than its
            frame as you scroll off the cover (frame-reader.tsx, scroll mode).
            A scrim on a PHOTO is fine; the guide's no-gradient rule is about
            the marks. It darkens from 30% down, so a long title and the
            series kicker above it stay readable on a bright photo (an
            earlier, lighter scrim left the kicker on a white ceiling).
          */
          <div className="relative h-full bg-graphite text-bone">
            {frame.image && (
              <div className="absolute inset-0 overflow-hidden">
                <Photo image={frame.image} className="fn-drift" />
              </div>
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_bottom,rgb(27_27_27/0.05),rgb(27_27_27/0.5)_30%,rgb(27_27_27/0.78)_55%,rgb(27_27_27/0.94))]" />
            <div className="relative flex h-full flex-col justify-end p-[8cqw] pb-[15cqw]">
              {frame.series && <p className={cn(MONO, "text-[2.6cqw] text-bone/80")}>{frame.series}</p>}
              <h2
                className={cn(
                  "mt-[3cqw] font-medium tracking-tight",
                  "text-[10.5cqw]",
                  "leading-[1.02]",
                  !frame.title && "opacity-40",
                )}
              >
                {frame.title || "Your title"}
              </h2>
              {frame.dek && (
                <p className="mt-[3.5cqw] text-[4.8cqw] leading-[1.3] text-bone/90" style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}>
                  {frame.dek}
                </p>
              )}
              {frame.credit && <p className={cn(MONO, "mt-[4cqw] text-[2.2cqw] text-bone/60")}>{frame.credit}</p>}
            </div>
            <Lockup dark />
          </div>
        ) : (
          <div className="relative flex h-full flex-col">
            {frame.image && (
              <div className="h-[58%] shrink-0 overflow-hidden">
                <Photo image={frame.image} className="fn-drift" />
              </div>
            )}
            <div
              className={cn(
                "flex flex-1 flex-col p-[8cqw] pb-[15cqw]",
                frame.image ? "justify-start" : "justify-end border-t-[1.4cqw] border-clay",
              )}
            >
              {frame.series && <p className={cn(MONO, "text-[2.6cqw]", muted)}>{frame.series}</p>}
              {/* Line-height AFTER the size: tailwind-merge drops a `leading-*`
                  that comes before a `text-*` size, as it did here once. */}
              <h2
                className={cn(
                  "mt-[3cqw] font-medium tracking-tight",
                  frame.image ? "text-[8.4cqw]" : "text-[11cqw]",
                  "leading-[1.02]",
                  !frame.title && "opacity-40",
                )}
              >
                {frame.title || "Your title"}
              </h2>
              {frame.dek && (
                <p className={cn("mt-[3cqw] text-[4.2cqw] leading-[1.35]", muted)} style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}>
                  {frame.dek}
                </p>
              )}
              {frame.credit && <p className={cn(MONO, "mt-[3cqw] text-[2.2cqw]", muted)}>{frame.credit}</p>}
            </div>
            <Lockup dark={dark} />
          </div>
        );
      break;
    case "text":
      body = (
        <>
          {/* Bottom padding clears the sign-off, so the overflow check counts it. */}
          <div data-size={frame.size} className="fn-rich h-full p-[8cqw] pb-[15cqw]">
            {children ?? <RichText doc={frame.doc} />}
          </div>
          <Lockup dark={dark} />
        </>
      );
      break;
    case "image":
      body = frame.image ? (
        <div className={cn("flex h-full flex-col", frame.fit === "contain" && "bg-bone")}>
          <div className="min-h-0 flex-1">
            <Photo image={frame.image} fit={frame.fit} />
          </div>
          {frame.caption && (
            <p className={cn(MONO, "shrink-0 bg-bone px-[6cqw] py-[3.5cqw] text-[2.7cqw] leading-normal text-muted-foreground")}>
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
              "border-l-[0.8cqw] border-clay pl-[5cqw] text-[7.6cqw] leading-tight",
              !frame.text && "opacity-40",
            )}
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}
          >
            {frame.text ? `“${frame.text}”` : "A line worth keeping."}
          </blockquote>
          {frame.attribution && (
            <figcaption className={cn(MONO, "mt-[6cqw] pl-[5.8cqw] text-[2.8cqw]", muted)}>— {frame.attribution}</figcaption>
          )}
          <Lockup dark={dark} />
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
            <p className={cn(MONO, "shrink-0 px-[6cqw] py-[3.5cqw] text-[2.7cqw] leading-normal text-bone/70")}>{frame.caption}</p>
          )}
        </div>
      );
      break;
    case "author":
      /*
        THE CLOSE: who wrote it — the reference carousels' last slide. A
        heading, a square portrait (graded, like every photo), name, role and
        company, and one link.
      */
      body = (
        <div className="relative flex h-full flex-col items-center justify-center p-[8cqw] pb-[15cqw] text-center">
          <p className="text-[6.4cqw] font-medium leading-none tracking-[-0.02em]">The author</p>
          {frame.portrait ? (
            <div className="mt-[6cqw] aspect-square w-[50cqw] overflow-hidden">
              <Photo image={frame.portrait} />
            </div>
          ) : draft ? (
            <div className={cn("mt-[6cqw] flex aspect-square w-[50cqw] items-center justify-center", dark ? "bg-bone/10" : "bg-graphite/5")}>
              <span className={cn(MONO, "text-[2.6cqw]", muted)}>Add a portrait</span>
            </div>
          ) : null}
          {(frame.name || draft) && (
            <p className={cn("mt-[6cqw] text-[5.6cqw] font-medium leading-[1.15]", !frame.name && "opacity-40")}>{frame.name || "Name"}</p>
          )}
          {(frame.role || frame.company) && (
            <p className={cn("mt-[1.5cqw] text-[3.8cqw] leading-[1.35]", muted)}>
              {[frame.role, frame.company].filter(Boolean).join(", ")}
            </p>
          )}
          {frame.link && (
            <a
              href={frame.link}
              {...(isExternal(frame.link) ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              className={cn(MONO, "mt-[4cqw] text-[2.6cqw] underline decoration-clay decoration-[0.4cqw] underline-offset-[0.8cqw]")}
            >
              {linkLabel(frame.link)}
            </a>
          )}
          <Lockup dark={dark} />
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
