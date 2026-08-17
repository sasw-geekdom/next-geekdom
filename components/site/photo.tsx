import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Photo as PhotoData } from "@/lib/photos";

/**
 * A photograph in a fixed-shape frame.
 *
 * `fill` + `object-cover` rather than letting the image set its own height, so
 * a row of photos crops to a shared shape instead of each one dictating a
 * different height and breaking the grid. The frame carries a `bg-sand-deep`
 * so the space is the right colour before the image decodes.
 *
 * `aspect` is a Tailwind CLASS, not a raw ratio, specifically so it can vary by
 * breakpoint — `"aspect-[16/9] lg:aspect-[4/3]"`. An inline `aspect-ratio`
 * style (the earlier approach) has no way to express that, which is what the
 * split hero needs. Pass literal strings: Tailwind scans source text, so a
 * class assembled from a variable is never generated.
 *
 * Omit `aspect` entirely when the caller sets an explicit height instead — the
 * hero does, because a fixed ratio at full-bleed width gets absurdly tall on a
 * wide monitor.
 *
 * `sizes` has no sensible default and is required for that reason. Omitting it
 * makes next/image assume 100vw and serve a desktop-width file to a phone
 * showing it in a third of a column.
 */
export function Photo({
  photo,
  sizes,
  aspect,
  priority = false,
  className,
  imageClassName,
}: {
  photo: PhotoData;
  sizes: string;
  /** Tailwind aspect class(es), e.g. `"aspect-[3/2] lg:aspect-[4/5]"`. */
  aspect?: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={cn(
        // Rounded by default; the full-bleed hero squares off its outer edge
        // with `lg:rounded-r-none`, which twMerge leaves alone because it's a
        // different breakpoint.
        "relative overflow-hidden rounded-xl bg-sand-deep",
        aspect,
        className,
      )}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        // Static imports carry a generated blurDataURL, so this costs nothing
        // extra and keeps the frame from flashing empty on a slow connection.
        placeholder="blur"
        priority={priority}
        className={cn("object-cover", imageClassName)}
      />
    </div>
  );
}
