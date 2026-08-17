<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

The parts that actually diverge here are routing, caching/revalidation, server
actions, config, and proxy. Read the guide before touching those; a Tailwind
class or copy change doesn't need one.

## Repo gotchas

- **Middleware is `proxy.ts` now** (Next 16 renamed it). Creating a
  `middleware.ts` gets you a file that silently never runs. `/admin/*` guarding
  lives in [proxy.ts](proxy.ts) **and** is re-verified in the admin layout, in
  every admin route handler, and in every server action — the proxy only checks
  that a cookie *exists*, never that it's valid. Don't treat it as the gate.

- **Every third-party client is constructed lazily, on purpose.** Firebase
  Admin, the Firebase browser SDK, Stripe, and Resend each **throw at
  construction** when their key is missing or malformed. Next evaluates every
  route module while collecting page data during `next build`, so a
  module-scope client turns a missing env var into a *build* failure on
  machines that were never going to call the service — CI, preview deploys, a
  fresh clone. Hence `getAdminDb()`, `getFirebaseAuth()`, `getStripe()`,
  `getResend()` rather than exported instances. If you add another SDK, follow
  the same shape. Reverting one to a top-level `const` will pass locally (you
  have `.env.local`) and break the deploy.

- **`firebase-admin` is pinned to v12 — don't bump it on its own.** v14 requires
  **Node >= 22**; this repo targets Node 20 (`.nvmrc`, `engines`). In the sibling
  `next-sasw` repo, `^14.1.0` broke production admin login outright (ESM-only
  `jose` → `ERR_REQUIRE_ESM`). Upgrading means moving Node to 22 first: `.nvmrc`,
  `engines`, **and** the Vercel project's Node setting (it's in the dashboard,
  not `vercel.json`). A blanket "update dependencies" pass will break this.

- **Stripe's `current_period_end` is on the subscription ITEM, not the
  subscription.** `subscription.current_period_end` is `undefined` on this API
  version and silently yields an Invalid Date on the member roster. Read it via
  `periodEnd()` in [lib/stripe/server.ts](lib/stripe/server.ts). Do not pass an
  `apiVersion` to the constructor either — stripe-node pins its own, and the
  TypeScript types are generated against exactly that pin.

- **The Luma API is not the one in most tutorials.** Base URL is
  `https://public-api.luma.com`, the endpoint is `GET /v1/calendars/events/list`
  (not `/public/v1/calendar/list-events`), entries are **flat** rather than
  wrapped in `{ api_id, event }`, and the identifier field is `id`, not
  `api_id`. The live spec is at `https://public-api.luma.com/openapi.json` and
  needs no auth — check it before changing [lib/luma.ts](lib/luma.ts).

- **The Stripe webhook is the only thing that creates a member.** `/welcome` is
  a dumb landing page anyone can visit; it deliberately reads and writes
  nothing. Never promote an applicant to a member from a client redirect.

- **Read the raw body in the webhook.** `await request.text()`, never
  `.json()` — Stripe signs the exact bytes it sent, and re-serializing fails
  every signature check.

- **Firestore rejects `undefined` field values** (it throws rather than skipping
  them), while zod hands you `undefined` for every blank optional field. Run
  writes through `stripUndefined()` in
  [lib/validation/schemas.ts](lib/validation/schemas.ts).

- **Required zod fields need `error` on the base type**, not only a message on
  `.min()`. `.min()` never fires for an absent field, so without it a missing
  value surfaces "Invalid input: expected string, received undefined" to an
  applicant — the forms submit with `noValidate`, so the server is the only
  validator.

- **npm, not pnpm.** There's a `package-lock.json` (the sibling `next-sasw` repo
  is pnpm — don't copy its commands over).

## Design system

Tokens live in [app/globals.css](app/globals.css) with the contrast math written
out. The one rule that matters: **rust and gold are not interchangeable.** Rust
on the light sand ground is 5.0:1 and passes AA; on the ink ground it drops to
3.3:1 and fails. Gold is the reverse — 9.3:1 on ink, 1.8:1 on white. Anything
rendering into a dark band uses gold (`Eyebrow onInk`, `Button variant="on-ink"`).

### Type

**Geist Sans** for everything you read, **Geist Mono** for everything you scan.
Mono is scoped to eyebrows, stat labels, dates, and micro-copy — it is not a
body face and not a heading face. `<Eyebrow>` already applies it; prefer that
component over hand-rolling `font-mono text-xs uppercase tracking-[0.18em]`.

Both are loaded **without a `weight`**, which gets the variable font. Adding an
explicit weight array silently switches to static cuts and ships four files to
cover a range one axis already spans.

**Geist Pixel is intentionally not loaded** — see the comment in
[app/layout.tsx](app/layout.tsx). next/font emits and preloads a face for every
route whose layout declares it, so adding a decorative third font here puts it
on the critical path of every page. If a real use turns up, declare it on that
component, never on the root layout.

Geist replaces Rubik, which is the face geekdom.com serves today. The logo is
unaffected — its letterforms are outlined paths in the SVG, so the wordmark
still renders in true brand type. Columns of figures get `tabular-nums`.

## Voice

Short declaratives. Active verbs. Parallel structure. No jargon, no
coworking-marketing filler ("vibrant ecosystem", "state-of-the-art amenities").

Two sources hold the register, and they say the same thing from opposite ends:

- **`MISSION` / `PROMISE` in [lib/site.ts](lib/site.ts)** — the forward-facing
  claim. *"Find your thinking partner."* / *"Hard problems don't get solved
  alone."*
- **The members letter** on
  [/whats-changing](<app/(site)/whats-changing/page.tsx>) — the backward-facing
  one. *"The desk was never the point."* / *"The space changes. The people in it
  don't."* Reproduced in full and **not** to be edited, summarized, or
  "punched up"; it's a real letter that really went out.

**The one line that must survive every rewrite:** the thinking partner is a
**person**, in a room, on the third floor. Not a tool, not a platform, not
software. The register is borrowed from good product writing on purpose, but the
subject is a physical space full of people — if a rewrite ever makes the
homepage sound like it could be describing an app, it has gone wrong.

Price is `MEMBERSHIP_PRICE_CENTS` in [lib/membership.ts](lib/membership.ts)
($100/mo) and is rendered through `priceLabel()`. Never type a dollar figure
into copy — it will drift from Stripe silently.
