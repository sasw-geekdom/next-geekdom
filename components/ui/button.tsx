import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ink" | "outline" | "ghost" | "on-ink";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  // Rust with a white label — 5.2:1, so the label passes AA, not just the
  // button's boundary. The anchor CTA everywhere on light ground.
  primary: "bg-rust text-white hover:bg-rust-deep focus-visible:ring-rust",
  ink: "bg-ink text-white hover:bg-ink/90 focus-visible:ring-ink",
  outline:
    "border border-ink/20 text-ink hover:bg-sand-deep focus-visible:ring-rust",
  ghost: "text-ink hover:bg-sand-deep focus-visible:ring-rust",
  // For use inside a full-bleed ink band, where rust drops to 3.3:1 and a
  // light-ground outline button disappears.
  "on-ink":
    "bg-white text-ink hover:bg-sand focus-visible:ring-gold focus-visible:ring-offset-ink",
};

/**
 * Exported so anything building a button-shaped control outside this file
 * still lands on the same scale, instead of hardcoding a height that is right
 * today and drifts forever after.
 */
export const buttonSizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-13 px-7 text-lg",
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

/** Same look as Button, rendered as a Next.js Link. */
export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
