// Shared by the admin's client form and the server actions that validate it.
import { PORTFOLIO } from "@/lib/site";

/**
 * The logo heights the wall can render. A CLOSED LIST, not free text:
 * `logoHeight` is a Tailwind class, and Tailwind only generates classes it
 * finds in source files — a class typed into the admin and stored in
 * Firestore would render with no CSS behind it. These literals are what
 * keeps each one in the build.
 */
export const LOGO_HEIGHTS = [
  { value: "", label: "Default" },
  { value: "h-6", label: "Small (24px)" },
  { value: "h-7", label: "Medium (28px)" },
  { value: "h-8", label: "Large (32px)" },
  { value: "h-9", label: "Larger (36px)" },
  { value: "h-10", label: "Largest (40px)" },
] as const;

/**
 * The logo files that shipped with the site — every one the static
 * PORTFOLIO references. Not offered as a picker (they belong to companies
 * already on the wall); kept so a saved record pointing at one still
 * validates. New logos are uploaded to Blob (lib/content/logo-upload.ts).
 */
export const LOGO_FILES: readonly string[] = [
  ...new Set(PORTFOLIO.map((c) => c.logo).filter((l): l is string => Boolean(l))),
].sort();
