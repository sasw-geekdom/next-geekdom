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
$100 — across seven of ten sections. The current spine, in
the source copy's order, is: one claim → the Club → the Studio → this month
in the Club → the 2011 origin → the portfolio → one ask. The price and the
benefit list belong on `/club`; don't move them back.

**The convening section ("What we are", rendering `ECOSYSTEM`) is off the
homepage at Geekdom's request.** Don't put it back unasked. `ECOSYSTEM` still
feeds the footer's "Beyond the club" column, so the `role`
rule above still applies.

**"Why there's an application" is off the homepage too**, and Geekdom was
explicit: "I definitely don't want to talk about why an application." They
may want something else in that slot — ask, don't fill it.

**"This month in the Club" is the source copy's list, in `THIS_MONTH`
([lib/site.ts](lib/site.ts)), maintained by hand monthly.** Luma isn't
connected. When it is, merge its events into the list instead of swapping the
list for cards, because some entries aren't Geekdom-hosted.

- **The Club and the Studio sit side by side as two panels, with no
  photographs** — `Offering` in the homepage. Geekdom found the old
  copy-beside-photo sections "too standard and basic" and too photo-heavy, and
  asked for the two offerings next to each other so the split reads at a
  glance. The grounds carry it (Bone with a hairline / Graphite). On hover
  the opposite ground wipes in from whichever edge the pointer entered and
  out through the edge it leaves (`OfferWipe`, 700ms), carrying an inverted
  copy of the type so the text changes color exactly on the wipe line —
  never time the text separately, that left the heading invisible mid-wipe.
  The other panel's type recedes. Don't put photographs back in these panels.
- **Never imply a pathway from the Club to the Studio.** The homepage had a
  "How the two fit together" section arguing exactly that — membership as the
  on-ramp, the Studio as where it leads — and Geekdom removed it: "We don't
  want to ever indicate that there is some clear pathway from Club to
  Studio." Don't rebuild it or fold its argument into another section.
  `/club` and `/studio` still carry versions of the claim ("One is the
  on-ramp…", "most Studio relationships start there") and are pending review.
- **The origin is "Geekdom started with an email"** (Graham Weston, 2009 —
  Geekdom opened in 2011, which is what "Since 2011" counts from), not
  "the desk was never the point." The second is the members letter's line — it
  is about what Geekdom *stopped* doing, and it belongs on `/whats-changing`,
  addressed to people who had a desk. On the homepage it apologizes for
  something the reader never knew existed.
- **`PartnerRow` is off the homepage and stays off.** See the note at the top
  of [partner-row.tsx](components/site/partner-row.tsx). `PortfolioWall` holds
  that slot now: Geekdom's own output rather than borrowed logos.
- **`POSITIONING` is the h1**, sliced for its Clay accent so the two can't
  drift. The close is "Building something?" and Apply, nothing else —
  Geekdom asked for it that way, retiring `HOOK` from the page and the
  second "Come to an event first" CTA.

## Photography

**Every photograph goes through the brand grade — never add one to
`public/photos/` directly.** Geekdom asked for "the same treatment for
cohesion based on the Photography section of the brand guide" (section 06:
slightly warm, slightly desaturated, Bone highlights, Graphite shadows, ~30%
black and white). [scripts/grade-photos.mjs](scripts/grade-photos.mjs) does
it per photograph toward one shared target:

- **Originals live in `photos/originals/`** (not served, never edited).
  `npm run photos:grade` writes the graded copy to `public/photos/` under the
  same name, which is what `lib/photos.ts` imports. A new photo: drop the
  original in, run the script, import it as usual.
- **Tune the constants and re-grade everything from source**; never grade a
  graded file. The script's header says which guide line each constant is.
- **Black and white is a list in the script** (`BLACK_AND_WHITE`), chosen by
  the guide's criteria — spotlights, ceremonial moments, profiles. Keep it
  near 30% of the library as photos are added.
- Before it existed the library's saturation ranged 7x and its warmth from
  cool to very warm; after, the color frames' saturation spread fell from
  0.08 to 0.03 and warmth from 16 to 5 (standard deviation).

**Photos have square corners — no rounding, 90 degrees, Geekdom's request.**
`Photo` carries none, and neither does any other image frame (video poster,
event cards, the memory-lane wall, admin thumbnails). Don't add `rounded-*`
to anything that holds a photograph.

Every frame in [lib/photos.ts](lib/photos.ts) was shot on the third floor —
**except the three Studio ones, deliberately.** `brianWhiteboard` is the EIR at
a whiteboard with a founder (currently unused — see below), `brianPortrait` is his
headshot, and `openlaneTeam` is a backed company's founders at their own
whiteboard — the `/studio` hero.

The "same floor" rule exists because the site's claim about the CLUB is that it
is this specific room. **The Studio is not a room-based product** — what it
sells is six to twelve months of one person's attention — so a photograph of
that person working, or of a company he backed, is more on-point than the floor
neither of them may be standing on. Scope the rule to Club imagery; don't apply
it to Studio.

**`brianWhiteboard` cannot be a full-bleed hero, and it has been tried.** The
camera original is 1200x802 where the library is 1600px, so it covers a 600px
slot at 2x and nothing near the ~2380 device px a bleed wants. `openlaneTeam`
won that comparison on resolution — the numbers are in
[lib/photos.ts](lib/photos.ts). It is the right frame for the homepage's
~460px Studio slot, where its 1.496 aspect is the 3:2 to within a rounding
error.

**Use the camera original, never an upscale.** An AI upscale of this frame
shipped for a while and rewrote the whiteboard behind him from "Brian
Sierakowski" to "Brian Siiewkowski" — more legible than the real handwriting,
on the one section that names him in copy three lines away. It also carried a
C2PA manifest from Google on the homepage of a brand whose guide says "Real
people, named. No stock." The original (NIKON D3100, 2 February 2015) is in
the repo now, in `photos/originals/`. `grahamNick` is the other upscale in this file; treat it the
same way if an original turns up.

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
  rhythm section repeated the events calendar. Its photography moved into
  the Club's clubhouse section and its wayfinding to `/contact`, which is what
  makes the deletion free:
  the page was expendable, the content was not. **Don't rebuild it.** A
  standalone page about the floor is a coworking-era argument — "look at our
  space" is how a coworking company sells — and the 2026 position is that the
  desk was never the point.
- **The address, the Maps link and the elevator line live on `/contact`.**
  They sat on `/club` as a stopgap and moved when `/contact` was built; the
  membership card keeps a one-line address. Don't put wayfinding back on
  `/club`.
- **`/events` and `/faq` are gone, at Geekdom's request** — neither is in
  `Source Copy v1`'s sitemap. `/events` (and every `/events/*`) 307s to the
  Luma calendar, `/faq` 308s to `/club` ([next.config.ts](next.config.ts)).
  The calendar is Luma's job; the homepage's "This month in the Club" links
  there. Don't rebuild either page without a spec from Geekdom.
- **`/club` does not lead with the price.** The order is the source copy's —
  the rhythm, the clubhouse, who's in the room, who it's for, then Membership,
  where the price sits in the membership card — not the headline, which is
  just "Application-based." Geekdom asked that nothing feel salesy, and at
  headline size the figure was the largest price on the site. Don't move the figure back into
  the hero: leading with the fee makes it a pricing page, and a pricing page
  asks "is it worth $100?" before the reader has anything to weigh it against.

  **The page tells a story and the order is the story**: the problem, the room,
  the rhythm, the clubhouse, who is in it, the bar, the price, how to start. The hero opens on `CLUB` in [lib/site.ts](lib/site.ts) — the
  same three beats the homepage's Club section reads, so the two cannot drift.

- **`/club` does not route anyone to the Studio.** It used to end on "The
  other engine" — "One is the on-ramp. The other is where it leads." — and
  that is the pathway Geekdom said never to imply, so it went. The Studio is
  in the nav and beside the Club on the homepage. Likewise `/studio` carries
  no "Apply to the Club" control.
- **`BENEFITS` renders ONCE on `/club`**, under "What's included", with titles
  and descriptions. It used to render twice — titles in a hero side panel,
  detail lower down — and this file said so; the side panel went when the hero
  was rebuilt to open on the claim rather than the feature list. A second
  render is now the thing to question, not the third.
- **Startup Bootcamp and the Community Fund are LIVE**, under the Studio. An
  earlier version of `lib/site.ts` and `/llms.txt` said all four of the
  one-pager's programs were legacy. Only the Incubator and the
  Pre-Accelerator are.

## The easter egg

`/since-2011` is a throwback page hiding behind the **Geekdom** word in the
footer's copyright line. Ported from the sibling `next-sasw` repo, where the
same page runs as "15 years of Geekdom".

- **Deliberately out of the sitemap and out of the nav.** An easter egg that
  ranks in search has stopped being one. It is still indexable and has a
  canonical, so a link someone shares works.
- **The count and the route are evergreen.** The heading computes from
  `FOUNDED_YEAR`, and the path is `/since-2011` rather than `/15-years` —
  which is true for exactly one year.
- **The photo wall reads a Firestore manifest, not Storage.** Originals go in
  the `since-2011/` Storage folder; the admin's **Photo wall** screen resizes
  them to WebP and publishes to Vercel Blob
  ([lib/gallery-sync.ts](lib/gallery-sync.ts)). A run is capped at 40 photos so
  a first batch can't blow the request timeout — the UI says to run it again.
  Needs `BLOB_READ_WRITE_TOKEN`; without it the page renders its empty state
  rather than failing.
- **`motion` is here for this page only.** Besides `lenis` (the site-wide
  scroll glide, below), it is the only animation dependency in a repo that
  otherwise does everything in CSS keyframes and IntersectionObserver, and it
  earns it for one effect: a scroll-linked
  parallax that differs per element. Don't reach for it elsewhere — check
  whether CSS does the job first.
- **`useReducedMotion` in [lib/use-reduced-motion.ts](lib/use-reduced-motion.ts),
  never motion's.** Motion's reads `matchMedia` during render and returns
  `true` on the client's first pass for anyone with the setting on, so any
  branch on it produces a hydration mismatch. Ours uses
  `useSyncExternalStore` with a `false` server snapshot. The full account is in
  that file.
- **The door wears the CLASSIC wordmark**
  ([geekdom-classic.svg](public/brand/geekdom-classic.svg)) — Geekdom's
  original light humanist mark with the spiky crown over the "d", not the
  condensed slab lockup in the navbar. That is the joke: a door to a fifteen-
  year retrospective wearing the logo those years were spent under. It is a
  SECOND wordmark on a site whose guide has one, so it is contained
  deliberately: one instance, 16px, in the quietest line on the page, and
  historical by nature rather than a variant of the current mark. Don't use it
  anywhere else. It ships flattened to Bone because an `<img>` can't take
  `currentColor`, and it's an `<img>` because the footer renders on every route.
- **The hero wordmark is flat Geekdom Red** — `.geekdom-mask` filled with the
  token. It was a WebGL shader flowing color through the mark, which the guide
  bans; see the marks rule under Design system.

## /apply

- **The header and opening are the source copy, verbatim:** "Apply to
  Geekdom.", the Fraunces line "Membership is by application. We respond
  within two weeks.", and one paragraph ("about ten minutes"). No price and no
  explanation of why there's an application — Geekdom asked for neither.
- **The form is custom, and the doc asks for Typeform + Airtable.** It stays
  custom pending Geekdom's call, because it feeds the whole membership
  pipeline: admin review → acceptance email → Stripe checkout → the webhook
  that creates the member. A Typeform embed sits outside all of that.
- **`formerMember` ("I was a Geekdom coworking member.") is load-bearing** —
  it reaches the admin detail view, the CSV export and the team email. Don't
  drop the checkbox without replacing that signal.

## Share cards and metadata

- **Cards are Bone, type-led, and carry no shader.** `npm run og` photographs
  `/og-preview/[slug]` ([og-card.tsx](components/site/og-card.tsx)) into each
  route's `opengraph-image.png`. The primary wordmark in Geekdom Red is the
  only mark on them — no crown as decoration, flat or WebGL: the guide bans
  marks in gradients or effects and bans the crown as a decorative element,
  and the cards were the shader crown's most distributed placement.
- **Every card is in `OG_CARDS`** ([lib/og.ts](lib/og.ts)), and its two lines
  come from that page's own copy. A PNG with no entry there is an orphan that
  `npm run og` never regenerates.
- **A page with its own card passes `ownCard: true`** to `pageMetadata()`;
  without it the page gets the root card, with alt text and dimensions.
- **Descriptions stay under 160 characters.** Google cuts at about 155, and
  three pages were losing their last clause — /studio its disqualifier.
- **No price in any description or card.** It lives on /club's membership
  card only.

## Scroll motion

Geekdom asked for "soft scrolling", and when asked whether that meant content
easing in or the page gliding, wanted both. They are two separate mechanisms:

- **Reveals are CSS only.** `Section`'s container carries `reveal-children`,
  so every direct child of every section rises and fades in on its own
  `animation-timeline: view()`. `.reveal` opts in a single element elsewhere.
  Unsupported browsers (Firefox, today), print and reduced motion get the
  content, fully visible, with no animation. Don't rebuild this with
  IntersectionObserver or `motion` — nothing here can get stuck hidden, and
  that property is the point.
- **The glide is Lenis**, mounted once in the `(site)` layout
  ([smooth-scroll.tsx](components/site/smooth-scroll.tsx)). Wheel and
  trackpad only — touch scrolls natively — never for reduced motion, never in
  admin. It still scrolls the real window, so scroll listeners, the navbar,
  `motion`'s `useScroll` and view timelines need nothing from it. A new
  scrollable panel works because of `allowNestedScroll`; if one ever glides
  the page behind it instead, add `data-lenis-prevent` to it.
- **A running transform animation makes its element a stacking context.**
  Every revealed block is one. Tested: the /apply combobox dropdown still
  paints over what follows it. A future `position: fixed` element placed
  INSIDE a section would be positioned against its block, not the viewport —
  portal it out, or give its block `.reveal`-free markup.

## Repo gotchas

- **Middleware is `proxy.ts` now** (Next 16 renamed it). Creating a
  `middleware.ts` gets you a file that silently never runs. `/admin/*` guarding
  lives in [proxy.ts](proxy.ts) **and** is re-verified in the admin layout, in
  every admin route handler, and in every server action — the proxy only checks
  that a cookie *exists*, never that it's valid. Don't treat it as the gate.

  **And never let it redirect on the cookie's presence alone.** It used to
  send `/admin/login` to `/admin` whenever a cookie existed; with an expired
  or revoked cookie that looped with the layout's redirect forever, and
  "Staff sign in" looked like a page that wouldn't load. The login page now
  verifies the session itself before skipping the form.

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

- **Three dependencies exist for one feature each, and none of them look it.**
  A dependency audit that goes by "is this imported from a page" will conclude
  all three are dead. They aren't:

  | package | pulled in by | reaches |
  |---|---|---|
  | `motion` | [memory-lane.tsx](components/site/memory-lane.tsx) | `/since-2011` only |
  | `sharp` | [gallery-sync.ts](lib/gallery-sync.ts) | the admin server action only |
  | `@vercel/blob` | [gallery-sync.ts](lib/gallery-sync.ts) | the admin server action only |
  | `lenis` | [smooth-scroll.tsx](components/site/smooth-scroll.tsx) | every public page, from the `(site)` layout |

  All four belong in `dependencies`, not `devDependencies` — `sharp` and
  `@vercel/blob` run on the server in production, and `motion` ships to the
  browser on that one route.

  **`gallery-manager.tsx` imports `SyncResult` as `import type`, and that is
  load-bearing.** It is a client component; a value import from
  `gallery-sync.ts` would drag `sharp` — a native binary — at it. Keep it
  type-only, or the admin bundle stops building.

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
  grows, tracking and leading both tighten. **Weights follow the guide's
  specimen (p. 9): `display`, `title` and `item` are Medium (500); `heading`
  and `subhead` — Section H1 and Sub H2 in the guide — are Regular (400).**
  This used to be "everything is 500", which flattened the hierarchy the guide
  draws. The guide says "Never Bold", and only 400 and 500 are loaded — a
  stray `font-bold` falls back to 500 rather than synthesising a fake weight.
- **`FIGURE`** — numerals only (milestones, the price). `tabular-nums` on every
  tier, because proportional digits make a column of figures wander.
- **`MONO`** — `eyebrow` (0.18em, a kicker standing alone) vs `label` (0.14em,
  a caption attached to something).
- **Buttons**: `Button` (a `<button>`), `ButtonLink` (an in-app route),
  `ButtonAnchor` (external or `mailto:`). **The third one exists because its
  absence caused thirteen hand-rolled `<a className="inline-flex h-13 ...">` to
  accumulate**, several already missing the focus ring or the size's own
  `text-*`. If a button shape is missing, add a variant — don't hand-roll it.

**Buttons are for Apply; everything else is an arrow link.** Geekdom asked
for "Explore Studio" and "Explore the Club" as "just a link with an arrow",
and the pattern now holds on every public page: secondary actions (Maps, the
calendar, Contact, billing) are `LINK_ARROW` / `LINK_ARROW_ON_INK` with
`ArrowRight` (in-app) or `ArrowUpRight` (external). A new outline or ghost
button on a public page is the thing to question.

**Buttons have square corners — no rounding, 90 degrees.** That is Geekdom's
own feedback, and `buttonClass` sets `rounded-none` at the base. Don't pass a
`rounded-*` override, and don't hand-roll a button that skips `buttonClass`.

Passing an override `className` to a button WITHOUT a `variant` leaves
`primary` in place, and if the override carries no background of its own
twMerge finds no conflict to resolve — so `bg-geekdom-red` survives and a
secondary action silently renders as a second primary CTA.

### Type

**Rubik** for everything you read, **IBM Plex Mono** for everything you scan,
**Fraunces italic** for the handful of editorial moments.

Rubik is loaded at **400 and 500 only** — the scale needs exactly two values,
and pinning them is what makes "Never Bold" enforceable rather than advisory.
It is the **variable font**, not two static cuts (Rubik ships no static files);
`next/font` declares the same 300–900 file twice, once per weight, and the
browser pins the `wght` axis per rule. **Its default instance is Light**, so
measuring the woff2 in `.next/static/media` as-is under-reports real 500 type
by ~4% — instantiate the axis at 500 first, or a headline that needs four
lines will look like it fits in three. It replaced Geist Sans, which
made the website the only Geekdom surface not in the brand's type. **Never use
italic Rubik**; the guide sends italics to Fraunces.

Mono is scoped to eyebrows, stat labels, dates, and micro-copy — it is not a
body face and not a heading face. `<Eyebrow>` already applies it; prefer that
component over hand-rolling `font-mono text-xs uppercase tracking-[0.18em]`.
It is IBM Plex Mono, Regular only — the face the guide names. Geist Mono stood
in for a while on the grounds that the two are interchangeable at 12px; they
are close, not identical, and the guide is specific.

Keep prose inside the guide's 65–75 characters a line: 16px body wants a
narrower column than 18px (the legal pages cap at 34rem for that reason), and
Rubik prose doesn't go below 13px — only tracked mono holds 12.

**Fraunces is declared on [editorial.tsx](components/site/editorial.tsx), never
on the root layout** — next/font preloads a face for every route whose layout
declares it, so a third family at the root would sit on the critical path of
every page. It is italic-400 only, and it goes on taglines, pull quotes and
member quotes. Not headings, not body, not UI. `<Editorial>` and `<PullQuote>`
are the entry points. Geist Pixel is still not loaded, for the same reason.

The logo is unaffected by any of this — its letterforms are outlined paths in
the SVG. Columns of figures get `tabular-nums`.

**The marks may appear only in Geekdom Red, Graphite or Bone, flat.** The guide
bans gradients and effects on them, and the WebGL shader that flowed color
through the crown, the G-mark and the wordmark is gone from the site —
`CrownShader`, `InkField` and `ShaderCanvas` were deleted, not parked. Draw a
mark with its mask class (`.crown-mask`, `.g-mark-mask`, `.geekdom-mask` in
globals.css) and a single token background; that also keeps the second red
(#AA2D29) in the supplied SVGs off the page. Don't reintroduce a shader, a
gradient, or a crown used as decoration.

**LaunchSA is a separate brand.** Geekdom operates it for the City of San
Antonio. Never put its mark in a Geekdom lockup or logo wall — it was in the
partner marquee and was removed. Refer to it by name, as a separate program:
the footer's "Related" column is the pattern.

## Voice

**US English. The audience is San Antonio.**

This has been corrected four separate times in this repo — `programme`,
`behavioural`, `honoured`, `modelling`, `colour`, `centred`, `recognisable`,
`cheque` — and each time it reached copy a visitor reads, once as far as the
terms of membership (`licence`, `behaviour`). Assume any new prose needs a pass
before it ships, and sweep on STEMS rather than whole words: the first attempts
caught `honour` but not `honoured`, `apologise` but not `apologises`.

Two proper nouns are exceptions and must survive the sweep:

- **Weston Centre** — Geekdom's first home. That is the building's real name.
- **Event Center** — Geekdom spells its own venue the American way; an
  earlier FAQ said "Centre" and that was the error.


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
