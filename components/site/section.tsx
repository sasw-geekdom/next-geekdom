import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Layout primitives shared by every page.
 *
 * `Section` owns the two things that were otherwise re-decided per page and
 * drifted: the horizontal gutter (which must match the navbar's, or the site
 * visibly steps in and out as you scroll) and the vertical rhythm.
 */

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function Section({
  tone = "sand",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  /** `ink` is the full-bleed dark band; accents inside it must use gold. */
  tone?: "sand" | "white" | "deep" | "ink";
}) {
  const tones = {
    sand: "bg-sand text-ink",
    white: "bg-white text-ink",
    deep: "bg-sand-deep text-ink",
    ink: "bg-ink text-white",
  };

  return (
    <section
      className={cn("py-20 sm:py-28", tones[tone], className)}
      {...props}
    >
      <Container>{children}</Container>
    </section>
  );
}

/**
 * Small monospaced kicker above a heading.
 *
 * `onInk` switches the accent from rust to gold. Rust on ink measures 3.3:1 and
 * fails AA for text this size; gold on ink is 9.3:1. See globals.css.
 */
export function Eyebrow({
  onInk = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { onInk?: boolean }) {
  return (
    <p
      className={cn(
        "font-mono text-xs uppercase tracking-[0.18em]",
        onInk ? "text-gold" : "text-rust",
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "mt-4 max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl",
        className,
      )}
      {...props}
    />
  );
}

export function Lede({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
