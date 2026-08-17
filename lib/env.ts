/**
 * Environment variable reading, with blank treated as absent.
 *
 * `process.env.X ?? fallback` only catches an *undefined* variable. A variable
 * that exists and holds an empty string sails through it, and that empty string
 * reaches code which expected the fallback. That isn't hypothetical: adding a
 * key to a Vercel project without filling it in, or copying `.env.example`
 * forward, both produce exactly that state — and it fails at the point of USE,
 * far from the cause. `new URL("")` throwing inside `metadataBase` is the
 * version of this that takes down an entire build.
 *
 * THESE TAKE THE VALUE, NOT THE NAME — `envOr(process.env.NEXT_PUBLIC_X, "…")`,
 * never `envOr("NEXT_PUBLIC_X", "…")`. Next inlines public variables into the
 * client bundle by matching the literal text `process.env.NEXT_PUBLIC_X`; a
 * dynamic `process.env[name]` lookup is invisible to that substitution and
 * quietly evaluates to `undefined` in the browser while working perfectly on
 * the server. Passing the value keeps the literal in the source where the
 * compiler can see it.
 */

/** The value, or `undefined` if it is missing, empty, or only whitespace. */
export function env(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** The value, or `fallback` if it is missing, empty, or only whitespace. */
export function envOr(value: string | undefined, fallback: string): string {
  return env(value) ?? fallback;
}

/** Whether the variable holds anything usable. */
export function hasEnv(value: string | undefined): boolean {
  return env(value) !== undefined;
}
