"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { FrameReader } from "@/components/field-notes/frame-reader";
import { cn } from "@/lib/utils";
import type { Frame } from "@/lib/field-notes/types";

/*
  The preview's stage: the real reader, at full width or held to a phone's
  390px — the reader sizes its frames from its own width (@container), so
  the phone view is the phone layout, not a squeezed desktop.
*/
export function PreviewStage({ frames, title }: { frames: Frame[]; title: string }) {
  const [phone, setPhone] = React.useState(false);
  const tab = (on: boolean) =>
    cn(
      "flex items-center gap-2 border px-3 py-2 text-sm transition-colors first:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
      on ? "border-graphite bg-graphite text-bone" : "border-border bg-bone-light text-graphite hover:border-graphite",
    );
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl leading-tight tracking-tight text-graphite">{title}</h1>
        <div role="group" aria-label="Preview width" className="flex">
          <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)} className={tab(!phone)}>
            <Monitor className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" /> Desktop
          </button>
          <button type="button" aria-pressed={phone} onClick={() => setPhone(true)} className={tab(phone)}>
            <Smartphone className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" /> Phone
          </button>
        </div>
      </div>
      <div className={cn(phone && "mx-auto w-[390px] max-w-full border border-border px-4 py-6")}>
        {frames.length ? <FrameReader frames={frames} label={title} /> : <p className="text-muted-foreground">No frames yet.</p>}
      </div>
    </div>
  );
}
