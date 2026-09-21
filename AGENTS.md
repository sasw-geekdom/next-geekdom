<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

The parts that actually diverge here are routing, caching/revalidation, server
actions, config, and proxy. Read the guide before touching those; a Tailwind
class or copy change doesn't need one.

## What Geekdom is, and what the homepage is for

**Geekdom is a convening institution, not a membership product.** It runs the
Club and the Studio — the two things you can join — and it also operates
LaunchSA for the City of San Antonio, produces San Antonio Startup + Tech Week,
is backed by the Accelerate South Texas fund, and sits on the regional team for
MIT REAP. That work lives in `ECOSYSTEM` in [lib/site.ts](lib/site.ts), and the
`role` field on each entry is required: **never flatten these to "partner"** —
operating something for the City and being invited into MIT's cohort are
different claims, and two of the four verbs still need confirming from Geekdom.

**The homepage answers "what is Geekdom in 2026", not "what replaced
coworking."** Its old spine argued one point — that one membership is worth
$100 — across seven of ten sections. The current spine is: one claim → the
portfolio → the convening work → the Club → the Studio → **how they connect** →
who's in it → what's on → the 2011 origin → one ask. The price and the benefit
list belong on `/club`; don't move them back.

- **The pipeline section is the thesis.** Club → Studio (membership is the
  on-ramp) and Studio → Club (the portfolio is the proof). Without it the two
  engines read as a landlord with a side fund.
- **The origin is "Geekdom started with an email"** (Graham Weston, 2011), not
  "the desk was never the point." The second is the members letter's line — it
  is about what Geekdom *stopped* doing, and it belongs on `/whats-changing`,
  addressed to people who had a desk. On the homepage it apologizes for
  something the reader never knew existed.
- **`PartnerRow` is off the homepage and stays off.** See the note at the top
  of [partner-row.tsx](components/site/partner-row.tsx). `PortfolioWall` holds
  that slot now: Geekdom's own output rather than borrowed logos.
- **`POSITIONING` is the h1**, sliced for its Clay accent so the two can't
  drift. `HOOK` closes the page.

## The two engines

Geekdom runs **the Club** (an application-based members' club, `/club`) and
**the Studio** (a venture layer that backs 4–6 founders a year, `/studio`).
The nav names exactly those two plus Apply, and that is the change the Geekdom
team asked for — everything else lives in the footer.

- **`/membership` is now `/club`** and 308s there ([next.config.ts](next.config.ts)).
  Don't reintroduce the old path.
- **The Studio has no open application.** Founders are scouted and invited.
  Never add an apply CTA to `/studio`, and never describe it as an accelerator
  or a cohort — the brand guide lists "accelerator" among the things Geekdom
  explicitly is not.
- **Studio facts live in `STUDIO`, `STUDIO_CRITERIA`, `STUDIO_PARTNERS` and
  `PORTFOLIO`** in [lib/site.ts](lib/site.ts). These are the terms of a live
  fund — check size, MRR floor, founders per year — so they are transcribed,
  not rounded, the same rule `MILESTONES` carries.
- **`/the-floor` is gone**, 308ing to `/club`. Half of it duplicated this site
  — it rendered `BENEFITS` a third time under "What's in the room", and its
  rhythm section repeated `/events`. Its photography and its wayfinding moved
  into the Club's clubhouse section, which is what makes the deletion free:
  the page was expendable, the content was not. **Don't rebuild it.** A
  standalone page about the floor is a coworking-era argument — "look at our
  space" is how a coworking company sells — and the 2026 position is that the
  desk was never the point.
- **The address, the Maps link and the elevator line are on `/club` as a
  stopgap.** They belong on `/contact`, which the source copy specifies and
  nobody has built. Move them when it exists; `/club` keeps the photography.
- **`/club` does not lead with the price.** The order is the source copy's —
  the rhythm, the clubhouse, who's in the room, who it's for, then Membership
  eighth of nine, where `priceLabel()` is the section headline. Don't move the
  figure back into the hero: leading with the fee makes it a pricing page, and
  a pricing page asks "is it worth $100?" before the reader has anything to
  weigh it against.
- **`BENEFITS` renders twice on `/club` on purpose** — titles in the hero side
  panel, titles plus descriptions lower down. That is summary and detail, not
  duplication. A third render anywhere is a bug.
- **Startup Bootcamp and the Community Fund are LIVE**, under the Studio. An
  earlier version of `lib/site.ts` and `/llms.txt` said all four of the
  one-pager's programs were legacy. Only the Incubator and the
  Pre-Accelerator are.

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

- **Preview mode is gated on the DOMAIN, not `VERCEL_ENV`.** The review URL
  `next-geekdom.vercel.app` is a *production* Vercel deployment, so
  `VERCEL_ENV === "production"` is true there — gating on it would switch
  preview mode off at exactly the URL that needs it. [lib/preview.ts](lib/preview.ts)
  checks whether `NEXT_PUBLIC_SITE_URL` resolves to `geekdom.com` instead, so
  the flag disarms itself the moment the real domain is pointed here.

- **Read env vars through [lib/env.ts](lib/env.ts), and pass the VALUE, not the
  name.** `process.env.X ?? fallback` misses a variable that exists but is
  empty — a blank Vercel field, a copied `.env.example` — and the empty string
  reaches code expecting the fallback (`new URL("")` inside `metadataBase` took
  down a whole build this way). The helpers take a value rather than a key
  because Next inlines `NEXT_PUBLIC_*` by matching the literal text
  `process.env.NEXT_PUBLIC_X`; a dynamic `process.env[name]` lookup is invisible
  to that and silently becomes `undefined` in the browser while working on the
  server.

- **`checkBotId()` throws when it can't reach its backend** — outside the Vercel
  runtime it reports a missing `x-vercel-oidc-token`. Unhandled that's a 500 on
  every submission, real applicant and bot alike. Call `isBot()` from
  [lib/botid.ts](lib/botid.ts), which fails **open** on an infrastructure error
  and still rejects a positively identified bot; the reasoning is written out
  there.

- **npm, not pnpm.** There's a `package-lock.json` (the sibling `next-sasw` repo
  is pnpm — don't copy its commands over).

## Design system

The 2026 brand guide (`Geekdom_Brand_Guide_2026.pdf`) is the source. Tokens live
in [app/globals.css](app/globals.css) with the contrast math written out, every
hex taken from the guide.

**Five colors, and Geekdom Red is not one of the working ones.** Bone
(`#F4F1EB`) is the ground, Graphite (`#1B1B1B`) carries text and the dark bands,
Concrete (`#6B6B6B`) is secondary text, Clay (`#C8623D`) is the accent, and
**Geekdom Red (`#CA3625`) is reserved for the logo plus one high-priority CTA** —
today, the Apply button and validation errors, and nothing else. It is named
`geekdom-red` at full length so every use of it shows up in a diff. There is no
gold, no sage and no sky on the public site; the three off-palette hexes that
remain are admin status chips in [badge.tsx](components/ui/badge.tsx), scoped
and documented there.

**Clay cannot carry small text, and this is the one place the guide contradicts
itself.** It lists "eyebrow labels" among Clay's jobs and states two pages
earlier that Clay clears AA "for large text only" — and it is right the second
time: 3.5:1 on bone, 4.3:1 on graphite, never 4.5. So Clay does rules, markers,
borders, focus rings, link underlines and accent type at 24px+. Eyebrow **text**
is Concrete on light and Bone on dark. Where an accent wants to appear beside
something readable, color the rule and leave the words alone — that is what
`LINK` in [section.tsx](components/site/section.tsx) does (graphite text, clay
underline) and it replaced fourteen hand-written `text-rust underline`s.

**Three surfaces, not four.** `Section` takes `bone` / `bone-light` /
`graphite` / `graphite-soft`. Bone Light is *lighter* than Bone, so alternating
bands step up rather than down, and pure white is gone — it is not in the brand.
Two same-tone sections must never end up adjacent; six points of luminance will
not separate them. Use a `border-rule` hairline instead.

### The scales

Type and buttons are **named scales, not per-component decisions**. Before
writing a `text-*`, `font-*`, `tracking-*` or a button-shaped `className`, use
the constant:

- **`HEADING`** in [section.tsx](components/site/section.tsx) — `display` /
  `title` / `heading` / `subhead` / `item`. One rule runs through it: as size
  grows, tracking and leading both tighten. **Everything is 500.** The guide
  says "Never Bold", and only 400 and 500 are loaded — a stray `font-bold`
  falls back to 500 rather than synthesising a fake weight.
- **`FIGURE`** — numerals only (milestones, the price). `tabular-nums` on every
  tier, because proportional digits make a column of figures wander.
- **`MONO`** — `eyebrow` (0.18em, a kicker standing alone) vs `label` (0.14em,
  a caption attached to something).
- **Buttons**: `Button` (a `<button>`), `ButtonLink` (an in-app route),
  `ButtonAnchor` (external or `mailto:`). **The third one exists because its
  absence caused thirteen hand-rolled `<a className="inline-flex h-13 ...">` to
  accumulate**, several already missing the focus ring or the size's own
  `text-*`. If a button shape is missing, add a variant — don't hand-roll it.

Passing an override `className` to a button WITHOUT a `variant` leaves
`primary` in place, and if the override carries no background of its own
twMerge finds no conflict to resolve — so `bg-geekdom-red` survives and a
secondary action silently renders as a second primary CTA.

### Type

**Rubik** for everything you read, **Geist Mono** for everything you scan,
**Fraunces italic** for the handful of editorial moments.

Rubik is loaded at **400 and 500 only**, as two static cuts rather than the
variable font — the scale needs exactly two values, and a static pair makes
"Never Bold" enforceable rather than advisory. It replaced Geist Sans, which
made the website the only Geekdom surface not in the brand's type. **Never use
italic Rubik**; the guide sends italics to Fraunces.

Mono is scoped to eyebrows, stat labels, dates, and micro-copy — it is not a
body face and not a heading face. `<Eyebrow>` already applies it; prefer that
component over hand-rolling `font-mono text-xs uppercase tracking-[0.18em]`.
The guide names IBM Plex Mono for this slot and Geist Mono is standing in;
they are interchangeable at 12px tracked-out uppercase.

**Fraunces is declared on [editorial.tsx](components/site/editorial.tsx), never
on the root layout** — next/font preloads a face for every route whose layout
declares it, so a third family at the root would sit on the critical path of
every page. It is italic-400 only, and it goes on taglines, pull quotes and
member quotes. Not headings, not body, not UI. `<Editorial>` and `<PullQuote>`
are the entry points. Geist Pixel is still not loaded, for the same reason.

The logo is unaffected by any of this — its letterforms are outlined paths in
the SVG. Columns of figures get `tabular-nums`.

**The marks may appear only in Geekdom Red, Graphite or Bone, and the guide
bans gradients on them.** `CrownShader` still runs a flow through the crown and
the g-mark; the gold is gone and all three values are now approved colors, but
it remains a gradient and therefore a **known, deliberate exception pending
sign-off** — see the note in [crown-shader.tsx](components/site/crown-shader.tsx).
Don't extend it to new placements before that lands.

**LaunchSA is a separate brand.** Geekdom operates it for the City of San
Antonio. Never put its mark in a Geekdom lockup or logo wall — it was in the
partner marquee and was removed. Refer to it by name, as a separate program:
the footer's "Related" column is the pattern.

## Voice

Short declaratives. Active verbs. Parallel structure. No jargon, no
coworking-marketing filler ("vibrant ecosystem", "state-of-the-art amenities").

The positioning line is **"Geekdom is San Antonio's club for serious founders
and builders."** Geekdom is not a coworking space, not an accelerator, and not
a generic community organization — the guide names all three explicitly.

Three sources hold the register:

- **`MISSION` / `PROMISE` in [lib/site.ts](lib/site.ts)** — the forward-facing
  claim. *"Find your thinking partner."* / *"Hard problems don't get solved
  alone."*
- **`TAGLINE_LINE`** — the guide's stated tagline, *"The best things get built
  because someone sat down next to the right person in the right room."* It
  sits under the homepage hero, in Fraunces. `TAGLINE` is the shorter operating
  line from the letter and carries the footer and the close; both are real and
  they are not interchangeable.
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

**"The bar isn't impressiveness. It's generosity."** Use this line, or its
logic, anywhere the tone risks turning gate-keepy. It reframes selectivity as
culture rather than prestige, and it is the guide's own prescribed fix.

Price is `MEMBERSHIP_PRICE_CENTS` in [lib/membership.ts](lib/membership.ts)
($100/mo) and is rendered through `priceLabel()`. Never type a dollar figure
into copy — it will drift from Stripe silently.
