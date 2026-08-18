import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The button system. Three shapes, one set of variants and sizes.
 *
 *   Button        a <button> — submits, toggles, anything with an onClick
 *   ButtonLink    an internal route, through next/link
 *   ButtonAnchor  an external URL or a mailto:, a plain <a>
 *
 * THE THIRD ONE EXISTS BECAUSE ITS ABSENCE CAUSED THE DRIFT. `ButtonLink` wraps
 * next/link, which is for in-app routes; every "Open in Maps", "Subscribe on
 * Luma", "Register on Luma" and "Email the team" therefore hand-rolled its own
 * `<a className="inline-flex h-13 …">`. Thirteen of them accumulated, and they
 * had already diverged: some omitted the focus ring, one dropped the size's
 * `text-base` and inherited whatever the parent had. A missing shape doesn't
 * stop people building the thing — it just stops them building it here.
 */

type Variant =
  | "primary"
  | "ink"
  | "outline"
  | "ghost"
  | "on-ink"
  | "on-ink-outline";

type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  // Rust with a white label — 5.2:1, so the label passes AA, not just the
  // button's boundary. The anchor CTA everywhere on light ground.
  primary: "bg-rust text-white hover:bg-rust-deep focus-visible:ring-rust",
  ink: "bg-ink text-white hover:bg-ink/90 focus-visible:ring-ink",
  outline:
    "border border-ink/20 text-ink hover:bg-sand-deep focus-visible:ring-rust",
  ghost: "text-ink hover:bg-sand-deep focus-visible:ring-rust",
  // For use inside a full-bleed ink band or over a dark scrim, where rust drops
  // to 3.3:1 and a light-ground outline button disappears.
  "on-ink":
    "bg-white text-ink hover:bg-sand focus-visible:ring-gold focus-visible:ring-offset-ink",
  // The secondary action beside `on-ink`. Was hand-written at three call sites
  // before it lived here, which is how the hero ended up with two solid CTAs
  // competing: an override className with no variant leaves `primary` in place,
  // and with no background of its own there is no conflict for twMerge to
  // resolve, so bg-rust survives.
  "on-ink-outline":
    "border border-white/25 text-white hover:bg-white/10 focus-visible:ring-gold focus-visible:ring-offset-ink",
};

/**
 * Exported so anything building a button-shaped control outside this file
 * still lands on the same scale, instead of hardcoding a height that is right
 * today and drifts forever after.
 *
 * Each size carries its own `text-*`. Dropping it doesn't make the button
 * inherit "nothing" — it inherits whatever the surrounding block is set to,
 * which is why one card's button rendered a step smaller than the same button
 * in a section.
 */
export const buttonSizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-7 text-lg",
  // Square, for a lone icon. No horizontal padding — the width IS the padding.
  icon: "h-10 w-10 text-base",
};

export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    buttonSizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

/** Same look as Button, rendered as a Next.js Link. For in-app routes. */
export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export interface ButtonAnchorProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  /** Adds target=_blank with the rel that makes it safe. */
  external?: boolean;
}

/**
 * Same look as Button, rendered as a plain <a>. For anything next/link should
 * not handle: an off-site URL, a mailto:, a tel:.
 *
 * `external` sets `rel="noreferrer noopener"` alongside `target="_blank"`
 * rather than leaving it to each call site, because `target="_blank"` without
 * `noopener` hands the opened page a reference back to this one.
 */
export function ButtonAnchor({
  className,
  variant = "primary",
  size = "md",
  external = false,
  ...props
}: ButtonAnchorProps) {
  return (
    <a
      className={buttonClass(variant, size, className)}
      {...(external
        ? { target: "_blank", rel: "noreferrer noopener" }
        : undefined)}
      {...props}
    />
  );
}
