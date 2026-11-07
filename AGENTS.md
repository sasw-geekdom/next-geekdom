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
LaunchSA for the City of San Antonio, runs San Antonio Startup + Tech Week,
helped create the Accelerate South Texas fund, and sits on the regional team
for MIT REAP. That work lives in `ECOSYSTEM` in [lib/site.ts](lib/site.ts), and
the `role` field on each entry is required: **never flatten these to
"partner"** — operating something for the City and being invited into MIT's
cohort are different claims. Geekdom's /about copy confirmed three of the four
verbs in their own words (operate LaunchSA, run Startup Week, helped create
Accelerate South Texas — the last corrected from "backed by"); MIT REAP's
"sits on the regional team" is still ours.

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

**"This month in the Club" is edited in the admin** (`/portal/admin/events`,
the `events` collection), with `THIS_MONTH` in [lib/site.ts](lib/site.ts) as
its fallback — see "Member portal and admin" below. Rows leave the site when
their event ends. **Luma is not connected to the app and won't be** (Geekdom's
call): the calendar lives on Luma and the site only links to it
(`LUMA_CALENDAR_URL`). The API client, the admin's read-only Luma list and
the sample events were deleted — don't rebuild them.

- **The Club and the Studio sit side by side as two panels, with no
  photographs** — `Offering` in the homepage. Geekdom found the old
  copy-beside-photo sections "too standard and basic" and too photo-heavy, and
  asked for the two offerings next to each other so the split reads at a
  glance. The grounds carry it (Bone with a hairline / Graphite). On hover
  the panel's NEXT TONE wipes in — Bone → Bone Light, Graphite → Graphite
  Soft — from whichever edge the pointer entered and out through the edge
  it leaves (`OfferWipe`, 700ms), BEHIND the type, which never changes
  color; the CTA arrow steps 4px and the other panel's type recedes to 60%.
  It replaced a full inversion (the opposite ground plus an inverted copy of
  the type), which Jesse found "still overly distracting" — don't bring the
  inversion back. Don't put photographs back in these panels.
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
- **The grade is one function, [lib/photo-grade.mjs](lib/photo-grade.mjs)**,
  shared by the script and the `/since-2011` wall's sync
  ([gallery-sync.ts](lib/gallery-sync.ts)), which grades each archive photo
  at 900px as it builds the thumbnail. The wall has its own
  `BLACK_AND_WHITE` (77 of 256, 30%; keep it there as photos are added) and a `GRADE_KEY` — bump it when the grade
  changes and the next sync rebuilds every thumbnail under a new URL. On the
  archive's 32 color frames the spread halved (saturation sd 0.13 → 0.08,
  warmth 28 → 15) — looser than the library, because the caps stop short on
  the four purple-lit frames. Moving the grade into the module re-graded the
  library byte-identical.

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

- **`/club` ends on "Host an event" — for COMPANIES, à la carte, no
  membership needed** (Geekdom's ask): offsites, planning days, workshops,
  client events, and one plain line that it's company events only, not
  private parties. It sits AFTER Membership, like /studio's corporate
  partner after the founder path — a second audience, after the story.
  No capacities or rates: none are sourced, so the form asks instead.

- **`/club` does not route anyone to the Studio.** It used to end on "The
  other engine" — "One is the on-ramp. The other is where it leads." — and
  that is the pathway Geekdom said never to imply, so it went. The Studio is
  in the nav and beside the Club on the homepage. Likewise `/studio` carries
  no "Apply to the Club" control.
- **`BENEFITS` is Geekdom's ten, in their order, titles only**, and renders
  once on `/club` under "What's included". Geekdom replaced the letter-derived
  list outright and dropped the descriptions ("too text heavy"). Don't
  reorder, add to, or re-describe it. "A good fit" beside it stands alone —
  "Not the right fit right now" came off at their request.
- **Startup Bootcamp and the Community Fund are LIVE**, under the Studio. An
  earlier version of `lib/site.ts` and `/llms.txt` said all four of the
  one-pager's programs were legacy. Only the Incubator and the
  Pre-Accelerator are.

## The easter egg

`/since-2011` is a throwback page; its door is the classic **Geekdom**
wordmark in the footer's copyright line. Ported from the sibling `next-sasw` repo, where the
same page runs as "15 years of Geekdom".

**Three ways in, and only three.** The footer's classic wordmark (the egg
itself; it was off while the wall was empty, at Geekdom's request); a
"Since 2011" photo strip on the member dashboard, because the people in the
photographs are largely the Club (hidden until the wall has photos); and
one line on the 404 page — "You found an old link. We kept the photos." —
because the ~600 coworking-era URLs that 404 on purpose bring exactly the
people who came looking for the old Geekdom. None of them is in the nav. The 404 itself is /apply's shape —
eyebrow, Section-H1, arrow links, the archive line in Fraunces past a
hairline — not a CrownPage: no crown rail, no red button.

**/since-2011 opens on photographs and closes on a request for more.** The
hero sizes to its content (wordmark ≤448px, one mono line) so the wall
starts inside the first screen down to 1280×720; the wall's heading is
sr-only for the same reason. Every frame opens the viewer — a native
`<dialog>` in Graphite (`.lightbox`), ←/→, Escape, focus back on the frame,
`data-lenis-prevent` — showing the sync's 1800px `large` copy, graded once at
that size with the thumbnail cut from it. The close is "Were you there?"
→ a mailto to club@ for photos, with Apply as an arrow link: the people
reading this page are mostly alumni, and the archive's early years are thin.

**Blob keys are the MD5 in hex** ([gallery-sync.ts](lib/gallery-sync.ts)).
Storage's `md5Hash` is base64, and used raw as a path it put a "/" in one
key in five and made `since-2011//…` for one photo, which Blob refused —
that photo never reached the wall. next-sasw's copy of this code has the
same bug.

- **Deliberately out of the sitemap and out of the nav.** An easter egg that
  ranks in search has stopped being one. It is still indexable and has a
  canonical, so a link someone shares works.
- **The count and the route are evergreen.** The heading computes from
  `FOUNDED_YEAR`, and the path is `/since-2011` rather than `/15-years` —
  which is true for exactly one year.
- **The photo wall reads a Firestore manifest, not Storage.** Originals go in
  the `since-2011/` Storage folder (its first 46 were copied from next-sasw's
  `15-years/`, the same wall's source there; 210 more are Wayback Machine
  recoveries of geekdom.com's old uploads, named `YYYY-NNN-…` by upload
  year, and Geekdom's `og-geekdom` set — all perceptually deduplicated
  against the wall and the library first); the admin's **Photo wall** screen resizes
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
- **/apply asks GEEKDOM'S OWN QUESTIONS, word for word** —
  [lib/application-questions.ts](lib/application-questions.ts), read off
  their Airtable, so imported and new applications read the same: first
  and last name, phone, city, LinkedIn or personal site, how they heard,
  the one-sentence brag, what they're building, what they've shipped in
  90 days, links, "which best describes you" (a checkbox group — Geekdom's
  nine options verbatim, commas and all), why Geekdom, what they'll give
  back, the next 6 months, other communities, anything else, and "I'm a
  current Geekdom member" (stored as `formerMember`). Ours on top: the plan
  picker and Company (required for Team and Enterprise).
- **Applications are ours again, end to end** (November 2026). Geekdom moved
  off Typeform and Airtable and runs the whole review in the admin. /apply
  renders [apply-form.tsx](components/forms/apply-form.tsx), which posts to
  [/api/apply](app/api/apply/route.ts): saved for initial review, a
  "we have your application" email to the applicant, a "new application"
  email to `APPLICATION_REVIEW_EMAILS` (Monica; falls back to
  `TEAM_NOTIFY_EMAILS`).
- **Three plans, one application** (`PLANS` in [lib/membership.ts](lib/membership.ts)):
  Solo ($100), Team ($200), Enterprise (no listed price). The form opens on
  a plan picker (`/apply?plan=team` preselects; /club's plan rows link that
  way); Team and Enterprise require a company. Figures come from `PLANS`,
  never typed. `MEMBERSHIP_PRICE_CENTS` is still the Solo price, for the
  single-price surfaces (terms, structured data, the billing mock).
- **The review is two steps, each a staff decision with its email**
  ([lib/admin/actions.ts](lib/admin/actions.ts), `moveApplication`):

      initial_review ─yes─▶ team_review ─yes─▶ approved
            └──no──▶ declined ◀──no──┘     ban: anywhere, no email

  Initial review is Monica's step but ANY staff can act (so nothing stalls
  when she's away); the history and the activity log record who decided.
  Yes at initial emails the team; no at either step sends the applicant a
  kind decline. Approve sends the congratulations: Solo/Team get their
  Stripe payment link in it ("pay, then portal" — they become members when
  the webhook confirms payment, then sign in and fill in their profile);
  ENTERPRISE IS A MEMBER AT APPROVAL (record + login created, terms agreed
  off the site) and the email links straight to sign-in. While Stripe isn't
  connected, the email says the payment link follows and staff use "Send
  payment link" once it is.
  - **Every move is checked in a transaction** against the table of
    allowed starting statuses, so a double click or two staff at once can't
    send two emails; emails, Stripe and member creation run after the
    commit and never undo it.
  - **Banned**: no email. A later application from that address is saved
    straight to Banned, staff aren't notified, and the applicant gets the
    ordinary "we have it" email — nothing tips them off. Reopen undoes it.
  - **Old statuses are read, never written**: "new"/"reviewing" read as
    initial review, "waitlisted" as declined (`normalizeApplicationStatus`).
  - The list is stage tabs with counts, filtered after one read (a status
    filter + date sort would need a composite index). The detail page shows
    the plan and the full history — each step, who, when, and its note.
- **The emails are in [application-templates.ts](lib/email/application-templates.ts)**,
  on the member emails' brand (Bone, square, the red wordmark, Graphite
  buttons). The old rounded-corner application templates were deleted.
  Never the generosity line in a decline — said to someone being turned
  away it reads as a verdict.
- **`EMAIL_REDIRECT_TO` is the test safety**
  ([lib/email/resend.ts](lib/email/resend.ts)): on any copy that isn't
  geekdom.com, every email goes to that one inbox, with the real recipients
  in the subject. Set it on Vercel's Preview environment and when testing
  locally (`delivered@resend.dev` is Resend's test inbox) — otherwise a
  reviewer approving a test application emails a real person, or club@.
  Read at send time; ignored on the live domain.
- **`formerMember` ("I was a Geekdom coworking member.") is load-bearing**
  — it reaches the admin detail view and the CSV export.
- **Event requests and Studio partner inquiries are ours too**
  ([lib/inquiries.ts](lib/inquiries.ts)). /club's "Plan an event" and
  /studio's "Contact us" are arrow links (Red is Apply's alone) that open
  [inquiry-form.tsx](components/forms/inquiry-form.tsx) in the slide-out
  — a native `<dialog>` in the top layer, so it escapes the sections'
  reveal transforms, with `data-lenis-prevent`. They post to
  [/api/inquiries](app/api/inquiries/route.ts) — LISTED in
  instrumentation-client.ts's BotID `protect`, like every route that calls
  `isBot()` — which saves the request and emails "we have it" to the
  sender and a notice to `EVENTS_NOTIFY_EMAILS` / `PARTNER_NOTIFY_EMAILS`
  (both fall back to `TEAM_NOTIFY_EMAILS`).
  - **One review step, not the Club's two**: they're requests to talk, not
    memberships. new → accepted ("let's plan it" / "let's talk") or
    declined, each emailing the sender (lib/email/inquiry-templates.ts);
    reopen moves it back to New quietly. Same transaction-checked moves and
    activity logging as applications. Reviewed at /portal/admin/inquiries
    (kind tabs — Event requests, Studio partners — and status chips), under
    Reviews → Requests; the Overview has a row of what's new.
  - **Typeform is gone from the site** — the popup component, the review
    mockups, their questions and its CSS were deleted. The inquiry forms
    ask the questions that were proposed to Geekdom in those mockups.

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

## Member portal and admin

**One sign-in, three roles.** `/sign-in` serves members and staff; the
account decides where it lands. Roles resolve on EVERY request in
[lib/auth/session.ts](lib/auth/session.ts), never from the cookie: superadmin
(`SUPER_ADMIN_EMAILS`), staff (`@geekdom.com`), member (an email with a
`members` doc whose status is active, trialing or past_due). Admin wins over
member. **Everyone signs in without a password**: members by email link,
staff by email link or Google (the password option came off the form).
**Roles are only given to VERIFIED emails** (`trusted()` in session.ts) —
without that, a password account with an unverified `@geekdom.com` email
would be staff, held back only by Firebase's self sign-up being off. You
can't refuse password tokens instead: Firebase labels email-link tokens
`sign_in_provider: "password"` too, and trying it locked out every member.
A new staff member's FIRST sign-in must be the email link (it creates their
login; self sign-up is off, so Google can't) — the Google error says so. The Google button has no `hd` domain hint any more —
members use personal Gmail, and the hint hid their accounts.

- **/sign-in looks like the portal, not the public site**: the portal's
  top bar (wordmark · "Member portal", "← Back to geekdom.com" top right) and
  one square tile — no CrownPage, no giant red crown (decoration the guide
  bans), no Clay flourish. Members get ONE path, the email link; Google and
  password sit below a rule in a labeled "Geekdom staff" section, because a
  member choosing Google before their account exists got "doesn't have
  access", which read as a rejection.
- **Sign-in links are sent by Geekdom, not Firebase**
  ([app/api/auth/email-link/route.ts](app/api/auth/email-link/route.ts)):
  the Admin SDK's `generateSignInWithEmailLink` + Resend + `signInLinkEmail`.
  Firebase's own email ("sign in to project-geekdom") can't be reworded, so
  the form never calls `sendSignInLinkToEmail`. The route sends only to
  staff and current members — creating their Firebase login if needed, so
  staff need no manual setup once self sign-up is off — and tells anyone
  else "We don't have a current membership under that email" instead of
  "Check your inbox" (Jesse's call: a non-member shouldn't be shown a step
  toward a door that isn't there). That makes the form a membership check,
  so lookups are capped at 10 per IP per 15 minutes. Former members (paused,
  canceled) are told their membership isn't active, with club@ to restart it. One link per address per minute (`authThrottle`). Its continue URL is SITE_URL/sign-in, so that domain
  must be in Firebase's authorized domains.
- **`/portal` is the member portal; `/portal/admin` is the admin behind the
  sidebar's labeled "Admin" switch** (a shield, and "← Member portal" inside
  the admin). It was a bare wrench; an unlabeled tool icon reads as the
  member's own settings. `/admin/*` and `/admin/login` 308 there. The switch
  renders only for staff, but that is UX: every admin page and action calls
  `requireAdmin()`, which sends a signed-in member to `/portal`. Tested: a
  member replaying a staff save action is redirected and nothing is written.
- **The admin sidebar is grouped by the kind of work** (`ADMIN_NAV` in
  lib/portal/nav.ts): Overview on top; **Reviews** — Applications and
  Requests (event and Studio partner requests; the code still calls them
  inquiries, lib/inquiries.ts), the things waiting on a yes or no;
  **Members** — the roster and Member resources; **Site content**.
  Invitations has no sidebar entry: it's the launch tool for members who
  joined before the workflow, opened from a button on Members and living
  at /portal/admin/members/invitations so Members stays highlighted.
- **The admin follows the brand, but works like a tool** (Linear / Vercel
  dashboard conventions; Jesse's call, November 2026). ADMIN ONLY — the
  public site and the member portal keep the brand's reading conventions.
  - **Kept from the brand**: palette, Rubik, square corners, Graphite buttons
    only (no red "Sync photos" / "Approve"), arrow links for secondary
    actions, dashed notices (no off-palette tints), content capped at
    max-w-7xl, the same account menu at the foot of the sidebar.
  - **Lists are tables** ([admin-ui.tsx](components/admin/admin-ui.tsx):
    `Table`, `Th`, `Tr`, `Td`, `RowLink`/`RowButton`): 44px rows, a sticky
    header row, fixed layout (each `Th` sets its width, long text
    truncates), the whole row clickable. Sort where it helps — in the URL on
    server pages (Applications: `?sort=&dir=`), in state on client lists
    (Members). Hide the least useful columns below md/lg rather than letting
    a phone scroll sideways.
  - **Don't show a column that says the same thing on every row**: the
    Status column appears only on an "All" tab; Company only when someone
    in view gave one.
  - **Status is a square marker + a word** (`Status`, `ApplicationStatusLabel`,
    `MemberStatusLabel`, `InquiryStatusLabel`), never a tinted chip, and
    never wraps. Only a real problem is red (past due); waiting in a queue
    is Clay ("todo"), not an alert. `MemberBadge` stays for the member
    portal.
  - **Labels are sentence-case Rubik 13px** (`ADMIN_LABEL`), not tracked
    uppercase mono; Tile takes `plainLabel` in the admin. `FieldGroup` keeps
    its mono legend because the member portal's drawers share it.
  - **No eyebrow on PageHeader** — the sidebar already names the group.
    Compact 24px title, on purpose. Views are underlined `Tabs` (with
    counts); a second filter row is `Segments`.
  - **A review is a PAGE, not a drawer** (an application, a request —
    [review-layout.tsx](components/admin/review-layout.tsx)): drawers are
    for editing a record; reviewing is reading long answers beside a
    decision that emails someone. Answers left, grouped by what decides
    it (Who they are / Why Geekdom / Anything else, Geekdom's wording);
    the decision, staff notes, details and history in a right column that
    scrolls on its own. Ban is a quiet link at its foot.
  - **Previous / Next walk the list the reviewer came from** — the row
    link carries the tab and sort, and both sides order through
    [review-queue.ts](lib/admin/review-queue.ts), so they can't disagree.
    j / k do the same outside a text field. A decision moves on to the
    next item (else the one before, else the list) and says what it did
    there (`?done=`, cleared from the address once shown).
  - **The Overview leads with "Needs attention"** — Linear's inbox: one
    row per kind of waiting work, each a count with a link to do it, and a
    row with nothing in it isn't shown (overdue applicants, initial and
    team review with the oldest's age, approved-but-unpaid, new requests,
    past due, nothing upcoming on the homepage, Field Notes with
    unpublished changes). "Waiting longer than two weeks" holds Geekdom to
    /apply's own promise. Then three numbers that move — current members
    (+ joined in 30 days), applications through /apply in 30 days vs the
    30 before, and portal sign-ins (the launch question) — then events,
    activity, recently joined and Field Notes. The add actions are in the
    header (`?add=1` opens the right drawer).
- **The top bar's right side**: "Admin portal" (staff only — it pairs with
  the "Member portal" label; not "Admin", not "management platform"), then
  the ACCOUNT MENU ([account-menu.tsx](components/portal/account-menu.tsx)):
  initials + name opens Profile, Admin portal (staff), geekdom.com (a new
  tab — the portal's only way back to the public site) and "Sign out" in
  words. It replaced a bare sign-out icon parked away from the name.
- **Two layouts in one shell** ([portal-shell.tsx](components/portal/portal-shell.tsx)):
  the MEMBER portal is a top bar (five pages — Book a room joined in
  Phase 4 — full width, the directory needs it) with a bottom tab bar on phones; the ADMIN keeps the sidebar.
- **The dashboard is a bento** ([app/portal/page.tsx](app/portal/page.tsx)),
  ordered by what changes most: the membership as ONE LINE under the
  welcome (plan · since · "Profile and billing →"; past due gets its own
  notice — it was a two-column tile for three facts that live on Profile);
  This month in the Club beside **Book a room** (your next bookings and
  hours left this week, or the way in); New in the Club full width (four
  newest — the people tile, and the reason the dashboard exists:
  everything else is Geekdom broadcasting, and the Club's promise is a
  person); the REAL latest Field Note (featured, else newest — it was a
  hard-coded sample with a dead link) beside Slack over Follow; Since 2011;
  a slim "Need something?" row. No "Sample content" banner — nothing on
  it is a sample. No Studio tile — that's the Club→Studio pathway Geekdom
  ruled out.
- **The profile leads with the DIRECTORY PROFILE** (the wide column — it's
  how other members see you, and the part a member works on), with a
  "Complete your profile" line naming what's missing (headline, role, ask
  me about, bio — each opens the editor). Beside it ONE membership panel:
  a Graphite band (plan, status, member since), then billing — plan,
  next payment, card, Manage billing, payment history. It was a Graphite
  card AND a billing section that each carried a date and disagreed
  ("Renews —" beside "Next payment"). The ten-field form opens in the
  slide-out from the card's Edit — never inline. Sample billing is said
  INSIDE the billing panel, not as a page banner; staff keep the preview
  notice. On a phone the profile comes first.
- **Billing is fully in-app — members never see Stripe's hosted portal**
  (Geekdom decision). "Manage billing" opens the billing slide-out
  ([billing-drawer.tsx](components/portal/billing-drawer.tsx)): plan, card +
  Update card, invoices and receipts, cancel at period end / resume, and a
  past-due banner that pays the open invoice in place. A MOCK until the
  Stripe keys exist; the real build is Stripe's Payment Element in the
  drawer (SetupIntent, card data never on our servers), `invoices.list`,
  `invoices.pay`, `cancel_at_period_end`. No "More billing options" link —
  no tax IDs or other payment methods needed. No autopay toggle: the
  subscription always auto-charges. **The mock's card fields are read-only
  on purpose** — never let a mock accept a real card number. `/account`
  still emails a Stripe portal link; switch it to "sign in" when this ships.
- **Every member-portal page starts with `PortalPage`**
  ([portal-page.tsx](components/portal/portal-page.tsx)): eyebrow, Section-H1,
  optional sample notice, then Tiles. No full-width rules, no standfirst —
  the older header sat 12px lower and ruled past the column, so titles
  jumped between tabs. FAQ & resources is two columns: the FAQ tile (with
  live resources above it, "coming soon" folded to one line) beside a
  sticky "At a glance" + "Still have a question?" column.
- **The directory is master/detail, not a card grid** — next-angels'
  pattern, because it has to hold 400+ people: an alphabetical list under
  sticky letter headings (`top-16`, under the 64px top bar) with an A–Z
  jump bar, a sticky profile pane on desktop, the slide-out on phones.
  Search covers "Ask me about" so "who knows X?" is answered by typing X.
  Each row's second line is role · company, else the HEADLINE — most
  imported profiles have neither role nor company, and a list of bare
  names said nothing about who to talk to. The pane shows only sections
  the member filled in (an empty "Ask me about" heading read as broken),
  with one quiet line for a sparse profile. The audience filter appears only once a member
  has set one, and lists only audiences in use (none imported had one).
- **The directory is REAL MEMBERS, LISTED BY DEFAULT** (Geekdom's call,
  November 2026) — [lib/directory.ts](lib/directory.ts): every current
  member whose `profile.listed` isn't false; they opt out at Profile →
  Edit. PROFILE FIELDS ONLY (headline, role, company, "ask me about", bio,
  links) — never an email or a phone. The profile is stored on the member
  (`MemberDoc.profile`, saved by `saveMyProfile`, the member resolved from
  the session); the dashboard's "New in the Club" is the four newest
  listed. The sixty invented sample people were deleted. Photos aren't
  stored yet — initials stand in (`public/mock/avatars/` remains only for
  the sample Field Notes authors, illustrated, never photos).
- **Outside `(site)`** — no public navbar, footer or Lenis. Same brand: Bone,
  Rubik and Plex Mono, square corners (the admin's old `rounded-*` was swept
  out), Graphite `ink` for main actions because Geekdom Red is reserved.
- **No `window.confirm` on member-facing actions** — use
  [confirm-dialog.tsx](components/ui/confirm-dialog.tsx): a centered native
  `<dialog>`, square on Bone, the thing as a small receipt, one plain line
  on what happens, the action in Graphite and the safe choice ("Keep it")
  holding the cursor; errors stay in it, success closes it. Cancelling a
  booking and taking someone off a team use it. (The admin still has a few
  native confirms; swap them when touched.)
- **Custom dropdowns only, never a native `<select>` or date picker** —
  Jesse's call. Use [combobox.tsx](components/ui/combobox.tsx) (now with a
  controlled `value` and a `searchable` override) and
  [switch.tsx](components/ui/switch.tsx). Event dates are month/day/year and
  15-minute time comboboxes, in Central time.
- **Admin editing happens in a right-hand slide-out**
  ([drawer.tsx](components/ui/drawer.tsx)), next-sasw's pattern rebuilt
  without `motion`: a native `<dialog>` (top layer, focus containment,
  Escape) with the slide in CSS (`.drawer` in globals.css). One column of
  `FieldGroup`s, Save/Cancel pinned in its footer. Not inline forms above the
  list — Jesse found that "staggered". Mark the first field `data-autofocus`;
  React's `autoFocus` loses to `showModal()`.
- **Teams: a Team membership is up to 10 people, the owner included;
  Enterprise has no fixed cap** (`seats` in `PLANS`; Enterprise's cap is
  ours, pending Geekdom). [lib/team.ts](lib/team.ts). EACH PERSON IS STILL
  A MEMBER IN THEIR OWN RIGHT — their own `members` record, login and
  directory profile — so sign-in and the directory need no special case. A
  teammate's record carries `teamOwnerId` (the member who applied and
  pays); the OWNER'S STATUS IS THE TEAM'S: `syncTeamStatus` copies it to
  every teammate from the Stripe webhook and from staff saving the owner,
  so a paused, canceled or past-due owner takes the team with them and a
  reactivated one brings them back (tested). The owner adds and removes
  people at Profile → Your team (`TeamCard`, actions resolve the owner from
  the SESSION, never the request); staff do the same from the owner's
  slide-out on Members. Adding is one transaction (seat count + write, so
  two adds can't overfill) and reuses a FORMER member's record for that
  email — an email with a current membership of its own is refused.
  Removing cancels the teammate and moves the link to `formerTeamOwnerId`.
  Teammates see whose membership they're on and no billing. Invitation and
  removal emails are in member-templates.ts.
- **Otherwise a Geekdom membership is one person**: one `members` record, one
  Firebase login. Staff add, edit and deactivate members at
  `/portal/admin/members` ([members-manager.tsx](components/admin/members-manager.tsx),
  [member-actions.ts](lib/admin/member-actions.ts)) — borrowed from
  next-angels' CRM: search + status/sign-in/tag filters, a slide-out
  per member that reads as a RECORD first (Linear's side panel: email and
  status under the name, an at-a-glance strip — plan, joined, portal,
  getting started — then Member / Membership / Portal and billing / Staff
  only / Team, label left and control right, nothing folded; the cursor
  only jumps into Name when ADDING; Save stays disabled until something
  changes, and Cancel reads Close), staff-only tags and notes, and each person's login
  state (no login / never signed in / last signed in) from ONE paged
  `listUsers`, not a lookup per member.
  - **Adding a member creates their Firebase login** (no email sent), which
    is what lets them in once self sign-up is off. Fixing an email MOVES the
    login rather than making a second one.
  - **Deactivate = status** — `inactive` (labeled **Paused**: stepping
    away, expected back) or `canceled` (left). The record stays, access ends
    on their next request, and they move to a folded **Former members** list
    (like past events); a search that matches one opens it. Past due stays
    current — a failed card isn't leaving. A Stripe-billed member's status is
    Stripe's and isn't editable here.
  - **One "View" filter** (all current / past due / never signed in / no
    login) — not separate Status and Sign-in dropdowns, which read as
    contradicting each other.
  - **Record ids are auto ids that never change**; email and
    `stripeCustomerId` are fields, looked up by value. The webhook finds a
    member by customer-id doc, then the `stripeCustomerId` field, then (at
    checkout) the email — so a staff-added or imported member who later pays
    is linked, not duplicated. Only a total miss creates a `cus_`-keyed doc.
  - Join dates are stored at noon Central (midnight UTC is the day before
    here).
- **First-login onboarding is a checklist, not a tooltip tour**
  ([lib/onboarding.ts](lib/onboarding.ts), `OnboardingPanel` on the
  dashboard): check your profile, see the directory, find an event, join
  Slack (only once the invite link is set), know the basics. Each step's
  link marks it done and goes there; Skip marks it without going; "Not now"
  folds it to one line; finished, it never shows again. Saving a profile
  ticks the profile step. Progress is `MemberDoc.onboarding` (follows them
  across devices; staff see it in the member slide-out). The first visit
  says "Welcome", every later one "Welcome back". Members only.
- **The launch invitations are sent in waves from /portal/admin/members/invitations**
  ([lib/invitations.ts](lib/invitations.ts)): pick a wave (not invited yet,
  haven't signed in, everyone, or a tag), tick or untick people, and see
  the email exactly as it renders — every admin reviews it there, so there
  is no preview send (one existed and was removed). **LOCKED UNTIL
  LAUNCH:** `INVITES_LIVE` is false, so nothing can be sent; the server
  refuses a real wave however it's asked. Live, a wave sends at most 40 per click, one at a time,
  skipping anyone already invited or signed in, and stamps
  `portalInvitedAt`. The email (`portalInviteEmail`) tells them they're
  listed in the directory and where to change it — the directory is
  opt-out, so that line must stay.
- **Geekdom's Airtable is imported by script**, not by hand:
  `npm run import:airtable -- "<MASTER - ALL.csv>"` is a DRY RUN (counts
  only, names the database); add `--commit` to write
  ([scripts/import-airtable.mjs](scripts/import-airtable.mjs)). The CSV is
  the Airtable view's "Download CSV" — real people's details, so it lives
  OUTSIDE the repo. "Recommendation" is the initial review's call and
  "Status: Approved" + "Response Sent" the team's, so: approved + sent →
  approved application + ACTIVE Solo member (joined the day the response
  went out, login created unverified like "Add a member", profile seeded
  from the application — headline = the "brag" cut to 160, bio = what
  they're building — LISTED); approved but never told, and recommended
  Approve → team review; recommended Deny (never told) → initial review
  with the recommendation in the notes, so the decline email goes out
  through the workflow; "Banned Camp" → banned. NO EMAIL IS SENT.
  Re-runnable: an email already imported, or an existing member, is
  skipped. First run (November 2026): 74 rows → 53 members.

**Conference rooms (Phase 4) are booked in the portal** — `/portal/rooms`
("Book a room" in the member nav), run from `/portal/admin/rooms` (Members
→ Rooms). [lib/rooms/](lib/rooms/).
- **The rules are in [rules.ts](lib/rooms/rules.ts)** (Jesse's call,
  November 2026; Geekdom can change them): 30-minute steps, 2 hours at most,
  up to 14 days ahead (today + 13), 4 hours per member per week (Sun–Sat
  Central, PER PERSON — each teammate has their own), instant (no
  approval), **Monday to Friday, 7 AM – 9 PM** (`BOOKING_WINDOW`,
  enforced server-side; weekends came off because staff aren't in).
  The Club is open 24/7, but staff are in 9–5 and the window covers nearly
  every meeting; for a weekend or outside the hours, members email club@
  (the page says so) and
  staff block the room for them — blocks can go at any hour. Central time
  throughout; the schedule shows the window, anything outside it is in the
  admin's table.
- **No double booking, by construction**: every 30-minute slot a booking
  takes is a doc, `roomSlots/{roomId}_{slotIso}`, created in the booking's
  transaction — two members racing for a slot, one wins (tested). The cap
  the same way: `roomWeeks/{memberId}_{sunday}` holds a member's slots that
  week (4 hours, and no holding two rooms at once). Cancelling deletes the
  slots and gives the minutes back. The page's free/busy is a convenience;
  `bookRoom` re-checks everything.
- **Every admin (staff and superadmin) can book too**, as themselves, under
  the same rules — `bookerFor()` in [rooms.ts](lib/rooms/rooms.ts), id
  `staff_{uid}`, no members record (which would put them in the roster,
  directory and counts). Staff who are also members book as the member.
- **Members see free and booked, never WHO**; staff see names. The optional
  "what's it for" note is staff-only.
- **Staff can block time** (a Geekdom event, maintenance — up to 12 hours,
  any day, no cap) and cancel any booking; cancelling a member's emails
  them (with an optional reason). A member cancelling their own gets no
  email; booking sends a receipt ([room-templates.ts](lib/email/room-templates.ts)).
  Staff actions are in the activity log ("Rooms"); member bookings aren't.
- **The rooms are PLACEHOLDERS** with Thanksgiving names — Cranberry and
  Cornbread (up to 10, 60-inch TV), Pumpkin and Harvest (up to 20, 75-inch
  TV) — until Geekdom names them;
  `DEFAULT_ROOMS` in [rooms.ts](lib/rooms/rooms.ts) is the list until the
  first admin save writes all four down (ids never change under a booking).
- **The day picker is a Monday-to-Friday calendar**, one row per week:
  one weekday header, short tiles with just the date, days before today or
  past the 14-day horizon faint, today marked by a Clay rule under its
  date (the REAL today — on a weekend it isn't a tile), a Clay square on
  days you have a room, and one line under it with the picked day's
  week's time left. A weekend `?day=` opens the first bookable day.
  Earlier tries: a row of 14 tiles (ran off the column), a labeled
  week-by-week calendar (~315px), two rows starting today (columns moved
  every day), Sun–Sat (before weekends came off). The phone tab bar sizes
  to its items (it was a fixed four).
- Availability reads are uncached on purpose — a stale "free" would send a
  member into a conflict.

**Member resources are edited in the admin** (`/portal/admin/resources`,
under Members; `settings/memberResources`, [lib/content/member-resources.ts](lib/content/member-resources.ts)):
the Slack invite (the dashboard's Slack tile), the Wi-Fi network and
password, the hours, the resource links and the FAQ on /portal/resources —
what used to need a developer. Before the first save the portal shows the
text it shipped with (data/mock/portal.ts), and the first save writes it all
down, so there is no "copy from the site" step. Every save is a TRANSACTION
over the one doc: the links and the FAQ are arrays, and two staff saving at
once would otherwise each write a copy missing the other's change. The
Wi-Fi password is members-only — both pages that read it check the session
first. **"What's the Wi-Fi?" is answered FROM the Wi-Fi fields**
(`faqForMembers`, matched on the question's wording) — it was its own
hand-written answer, so updating the Wi-Fi left the FAQ on its placeholder.
The admin shows that row as "From the Wi-Fi fields". A link with no address lists under "Coming soon"; FAQ "move" swaps
within its own section. **Book a room is a BUILT-IN resource** on FAQ & resources (like Slack):
always live, linking to /portal/rooms; a saved "Book a room" row (a
pre-rooms placeholder) is ignored there and badged "Built in" in the admin.
On a phone, "At a glance" (Wi-Fi with a Copy button, hours, address) comes
first, and "Still have a question?" follows the FAQ.

**Every staff change is in the activity log** ([lib/admin/activity.ts](lib/admin/activity.ts),
the `activity` collection): who, what, to which thing, when — the
Overview's "Recent activity" tile and `/portal/admin/activity` (filter by
area). Call `logActivity(user, …)` AFTER a write succeeds; it never throws,
so a lost history line never refuses the edit. A new admin write should log
too. Not every save: a Field Note's draft autosaves every 30s, so drafts log
when created, published, unpublished, featured or deleted — not per save.
One `orderBy("at")`, filtered after the read, so no composite index. Also logged:
**staff notes** on an application or request — THAT they changed, never
the text (notes about a person stay on their record), and only when they
actually changed; **every CSV export**, with its row count (the one action
that takes personal details off the site); and **a Stripe payment that
makes someone a member**, with "Stripe" as the actor, once per payment
(guarded against Stripe's redeliveries).

**Site content edited in the admin: `events` and `portfolio`**
([lib/content/](lib/content/)). The pattern, for anything added next:

- **Read through `unstable_cache` with a tag**, not `"use cache"` — this app
  doesn't enable `cacheComponents`, and turning it on would forbid the
  homepage's `revalidate` export. The cached function THROWS on error so a
  failure isn't cached as the answer.
- **Give every cache an expiry, never "forever".** The live site, previews
  and local dev share ONE database but each keeps ITS OWN cache, and
  `updateTag` clears only the copy the save was made on — so Wi-Fi edited
  on one copy stayed old on the others indefinitely. Member resources
  expire in 60s, portfolio and Field Notes in 5 min, events in an hour.
  Changing an existing cache's options doesn't retire entries already
  stored: bump its key (`:v2`) when you do.
- **Fall back to the static data in `lib/site.ts`** when the collection is
  empty or Firestore is unreachable, so `next build` without credentials
  still renders the page (tested: `/` stays `○ 1h`). The static lists are
  the fallback and the seed ("Copy from the current site"), not the source.
- **Write with `requireAdmin()` → zod → Firestore → `updateTag(tag)` +
  `revalidatePath` for every page that renders it.** `updateTag`, not
  `revalidateTag`: it's the Next 16 read-your-own-writes call in a server
  action; `revalidateTag(tag, "max")` serves the stale page once more.
- **An event's host is shown on the site** ("Hosted by …" under the title,
  homepage and dashboard) when it isn't Geekdom — so it stays OUT of the
  title. Past events sit in a closed `<details>` in the admin. No event
  search yet: worth adding once the past list runs to dozens.
- **Dropdowns never move the page they're in.** The Combobox opens upward
  when there's no room below inside its scroll container, caps its height to
  the space it gets, and scrolls only its own list — `scrollIntoView` there
  used to lurch the whole slide-out 200px.
- **The wall's order is the admin's**: staff drag cells in
  `/portal/admin/portfolio` (native HTML `draggable`, plus Move
  earlier/later buttons, since native drag-and-drop has no keyboard path),
  saved as `order` by `reorderPortfolio`. `PortfolioWall` renders the list
  as given — don't re-add a sort by `founded` there; it would undo every drag.
- **`logoHeight` is a closed list** (`LOGO_HEIGHTS`): it's a Tailwind class,
  and a class that exists only in Firestore has no CSS.
- **Logos are uploaded to Vercel Blob** ([logo-upload.ts](lib/content/logo-upload.ts)),
  never picked from a list of other companies' files. The server rejects
  anything without real transparency (the wall is a CSS mask, so a solid
  background renders as a block) and SVGs with scripts or external links.
  Blob, not Firebase Storage, because masks are fetched with CORS and Blob
  allows it. **Pass `token: process.env.BLOB_READ_WRITE_TOKEN` to every Blob
  call:** on a `vercel link`ed machine the SDK otherwise picks up an OIDC
  credential that this store refuses in development.

## Field Notes (the blog)

**A Field Note is a CAROUSEL OF FRAMES read sideways** — Instagram-style,
Jesse's reference (Voice of San Antonio's carousels) — not a long article.
Up to 20 frames of six kinds: cover, text, photo, quote, video, author. A
new note opens Cover → Text → Author: a cover, a content frame, a close
that spotlights who wrote it.

- **The sign-off is a LOCKUP, not a logo**: the Geekdom wordmark │ "FIELD
  NOTES" in Plex Mono, bottom-right of every cover, text, quote and author
  frame (not photos or videos — it would sit on someone's picture). The
  guide gives Geekdom one wordmark, so Field Notes gets a lockup of it, the
  member portal's pattern. If Geekdom commissions a Field Notes mark, it
  replaces `Lockup` in frame-view.tsx. Red on Bone, Bone on dark.
- **Covers**: "full" (photo edge to edge, type over a Graphite scrim that
  darkens from 30% down) or "split" (photo above). Series kicker and photo
  credit in Plex Mono, title Rubik 500, dek Fraunces italic — not a serif
  headline: the guide sends headings to Rubik.
- **Text frames are Large by default** (`data-size`, ~70 words, big type,
  few words); Regular remains.
- **The author close** feeds the JSON-LD author (role, company, portrait,
  link), not just a name.
- **The one scroll effect**: the cover photo drifts ~4% slower than its frame
  as the note page scrolls off it (`.fn-drifting .fn-drift`, `--fn-drift`
  set by the scroll reader). Scroll-tied, never timed; absent in stage mode
  and reduced motion. Don't add a second. Written at `/portal/admin/field-notes`;
read at `/field-notes` (a sideways shelf of covers, newest first) and
`/field-notes/[slug]` (the note in `FrameReader`, "More Field Notes" under it).

- **The index is paged, and the hero appears ONCE.** `/field-notes` is
  the featured hero plus a grid of 8; `/field-notes/page/N` is a grid
  of 16 (`FEATURED` / `FIRST_GRID` / `PER_PAGE` in note-grid.tsx), with
  "← Newer" / "Older →" arrow links and "Page N of M". Pages 2+ head with
  the share card's hook, "Stories from the room.", the intro line and
  "Page N of M · date range" — not "Older Field Notes", which said nothing
  about what's there (Jesse's call). `/page/1` 308s to
  `/field-notes`; past the end or not a whole number is a 404. Real
  addresses, not "load more", so a crawler reaches every note. The slug
  `page` is reserved (`RESERVED_SLUGS` in schemas.ts) — a note there would
  shadow the pagination. Card dates carry the year once it isn't this one.
  `SAMPLE_FIELD_NOTES_REPEAT=N` (review builds only) repeats the samples N
  times so pagination can be seen before there are 10+ real notes.
- **The hero IS the newest note** (`FeaturedNote`): a spread INSIDE the
  page width, type left (the lockup as the page's h1 and the story's label,
  then title, dek, byline, "Read the story →"), cover photo right at 4:3.
  Not a full-width lockup row ruled off above it — that read as a second
  navbar — and not a full-bleed photo (too wide for an index; both Jesse's
  calls). Nothing on the photo, no scrim. Then ONE "More Field Notes" grid
  of 8 — a row of four with deks sat between them and was cut as a repeat.
- **The hero is the FEATURED note, else the newest.** Staff pin one live
  note with "Feature" in the admin list (`setFeatured`, one batch that
  clears every other pin); the list badges whichever note is in front.
  `featured` is a doc field, not part of the snapshot — placement isn't
  content, so it applies without a publish; unpublishing clears it.
  `indexOrder()` puts it first for both index routes; a real pin beats a
  sample's (the sample pin is "The same table, fifteen years apart").
- **The index is a magazine front**: the featured hero, then one card grid
  (`NoteGrid`). A centered lead with two stories either side
  (Voice of San Antonio's module) came first and was replaced when Jesse
  asked for the hero to be the featured post. Thumbnails are the COVER PHOTO,
  not the cover frame (it sets the title inside, so it would print twice).
- **Sample notes are review-only** (data/mock/field-notes.ts, six of them, with photos from the library and the /since-2011 wall in public/mock/field-notes/):
  `listForReaders` / `getNoteForReaders` add them on review builds
  (`ON_LIVE_DOMAIN` false), noindex and no JSON-LD. No on-page notice —
  Jesse briefs the reviewers instead, so the layout reads as it will ship. They are never written to Firestore — the live site shares its
  database with every review build that has no preview database of its own
  (see "Preview data"), so a published sample could go public — and the
  sitemap, llms.txt and JSON-LD read the real-only `listPublished`. Sample
  authors get illustrated avatars, never photos.
- **Deleting a note straight from Firestore leaves it in the public cache**
  (unstable_cache persists on disk across restarts): delete from the admin,
  which calls `updateTag`.
- **In the footer, never the nav** (Jesse's call) — the nav is the two things
  you can join, plus Apply. The source copy wanted the page hidden "until we
  populate with several articles"; it's linked at Geekdom's request, so its
  empty state says what's coming.
- **The public pages read the published SNAPSHOT only**, cached
  (`listPublished`, tag `field-notes`), ISR with a 1-hour backstop; every
  write calls `updateTag` and revalidates /field-notes, every note page, the
  sitemap and llms.txt. Note pages render on demand — a build never touches
  Firestore. An old slug 308s to the current one (`previousSlugs`); an
  unknown one 404s.
- **SEO per note**: `fieldNoteMetadata` (og:type article, the note's own
  card, canonical), BlogPosting JSON-LD with a VideoObject per video, a
  sitemap row and an llms.txt line. The index has a static card in OG_CARDS.
- **The note page is SCROLL-DRIVEN** (`FrameReader mode="scroll"`): the stage
  pins under the navbar (sticky; its section is one window tall plus 0.8 of
  a window per extra frame) and the page's vertical scroll slides the frames
  sideways — wheel, trackpad, space, the scrollbar, a phone's swipe up; a
  sideways swipe maps onto it too. The compact header rides inside the pin.
  It SETTLES on the nearest frame by redirecting Lenis's glide via
  `targetScroll` 140ms after the last input — waiting for scroll events to
  stop instead took ~3s, because Lenis fires them through its whole glide.
  Arrows, ←/→ and the progress segments scroll the page to each frame's
  exact spot. Reduced motion and one-frame notes get the plain stage; so
  does the admin preview. Don't put an `overflow: hidden/clip` ancestor
  above it — that silently breaks `position: sticky`.
- **A Field Note keeps the navbar** (`keepBar` in site-navbar.tsx): every
  other page slides the bar away on scroll down, but the reader pins UNDER
  it, so a hidden bar left a 64px empty band above the note. The side
  arrows step aside while the page scrolls and return 0.4s after it stops;
  a keyboard-focused arrow never hides (`focus-visible`).
- **The reader is a STAGE: one frame at a time** (`FrameReader`), centered,
  sized from the window's HEIGHT less `--chrome` (MacBook Air ≈ 600×750,
  2560×1440 ≈ 990×1230), full-bleed, neighbors 96px off with the arrows
  centered in that gap; off-stage frames are `inert`; ←/→ work page-wide
  unless typing; a segmented progress bar under it. It replaced
  two-and-a-bit frames side by side, where no frame was the subject.
  - **Neighbors dim by ground**: Bone frames to 30% (big type at 45% still
    read and competed), Graphite and photo frames to 45% (35% went flat).
  - **Phone**: 86% wide (`.fn-fw` in globals.css) and TOP-aligned in the
    pin — centered, it left ~115px empty above the title and the frame took
    46% of the screen. Share rides the back link's row there, so the header
    is three lines, not four.
  - **The edges of a note**: "Scroll to read →" ("Swipe up ↑" on a phone)
    by the count until the first move; an **Up next** card after the last
    frame — the next note in index order, wrapping — counted as a stop but
    not as a frame (the progress reads "Up next"); and the pinned title is
    hidden on the cover from sm up, since the cover prints it.
  - **Share** (`ShareNote`, in the pinned header): the phone's share sheet
    or copy-link ("Link copied"), plus a LinkedIn arrow link.
  - **The author close never shows the editor's placeholders**: "Add a
    portrait" and "Name" render only with `FrameView`'s `draft` prop (the
    editor canvas and filmstrip). They leaked to readers until it existed.
- **The shelf is `SideScroller`** (index, "More Field Notes") — several items
  on screen, "Next" disabled at the track's END rather than on the last
  item. Both share `useWheelSideways` (vertical wheel → sideways while the
  track can move; `data-lenis-prevent`).
- **Dev-only symptom, not a code bug:** the card route once returned 500
  "Input buffer contains unsupported image format" (sharp, inside @vercel/og)
  in a dev server that had run through two `npm install`s; a restart fixed
  it and it didn't recur. Restart `next dev` before debugging the card.

- **Draft vs live.** Everything edits the DRAFT; publishing copies it into a
  snapshot (`publishedJson`) that is all the public side will read. Editing
  a live note shows "unpublished changes" and changes nothing public until
  "Publish changes". A changed slug records the old one in `previousSlugs`
  for future redirects.
- **Frames are stored as a JSON string**, not a Firestore array — Tiptap's
  JSON nests arrays in maps in arrays deeper than Firestore allows.
- **Rich text is an allowlist, rebuilt, never HTML.** `cleanDoc` rebuilds
  Tiptap JSON from paragraph/heading/blockquote/caption/lists/hard break and
  bold/italic/link (links: https, mailto, or a site path). The reader renders
  that JSON with its own components; there is no sanitizer because there is
  no HTML. Re-parsed on the way OUT too, so a doc edited in the console can't
  reach a reader unchecked.
- **Brand styles, not fonts** (Jesse's call): Body / Heading / Subhead in
  Rubik, Pull quote in Fraunces italic, Caption in Plex Mono. Bold is Rubik
  500; ITALIC IS FRAUNCES (never italic Rubik); no underline (reads as a
  link), no colors, no sizes. `.fn-rich` in globals.css styles the editor
  and the reader alike.
- **Frame type is in `cqw`** (container units, `.fn-frame`), so a frame is the
  same composition as a filmstrip thumbnail, in the editor and in the reader
  — the editor's "runs past the frame" warning is a real overflow.
- **Uploads go browser → Blob directly** (`@vercel/blob/client` `upload()` +
  /api/admin/field-notes/upload). A server action can't take the files:
  Vercel caps function bodies at 4.5MB. The token route is the gate — staff
  session, path inside one existing note's folder, type and size per kind
  (photos 25MB, video 200MB MP4/WebM). Everything a note owns lives under
  `field-notes/{noteId}/`, so deleting a note is one prefix sweep; publish
  also sweeps files nothing points at (sparing anything under an hour old).
- **Every photo gets the brand grade** (`gradePhoto` → `gradeRaw`), and the
  ORIGINAL is kept so the per-photo B&W switch re-grades from source.
- **Video**: YouTube/Vimeo links behind a click-to-load facade (nothing from
  either loads until play — /studio's rule), or uploaded clips, optionally
  silent-looping.
  **The poster is a photo of whoever is speaking**, uploaded like any photo
  — never YouTube's or Vimeo's thumbnail (designed promo cards, off brand:
  see components/site/video-card; a "use the thumbnail" button was built
  and removed for that reason). The editor labels it "recommended" and says
  why when it's missing. With a poster the play button sits bottom-left, off
  the subject — centered, it covered the speaker's face.
- **Share cards are generated at publish** with `next/og` (lib/field-notes/
  og-card.tsx) and stored on Blob; an uploaded 1200×630 overrides. Satori
  needs STATIC TTFs, so Rubik 400/500 and Plex Mono are committed in
  `assets/fonts/`, and next.config.ts's `outputFileTracingIncludes` ships
  them — a path read isn't traced, and without it every card fails in
  production. The editor previews the exact card from the draft.
- **Publish checklist** (`checklist()`, shared by the editor and the server):
  title, slug (unique — checked server-side), a cover first, ≥2 frames, no
  empty frames, alt text on every photo, a 50–160 character description, an
  author. Publish is refused until it passes.
- **The preview is at `/preview/field-notes/[id]`, outside /portal** so it
  looks like the public page (no admin sidebar) — so it does its own
  `requireAdmin()`, and `/preview` is disallowed in robots.
- **`cn()` gotcha, found here:** tailwind-merge drops a `leading-*` that comes
  BEFORE a `text-*` size. Put line-height after the size.

## Preview data

**A preview can have its own database, and should.** Every deployment used
to read and write ONE Firestore, so a reviewer publishing a test note on a
branch preview published it everywhere. `FIREBASE_DATABASE_ID` points a
deployment at a separate named database ([lib/firebase/admin.ts](lib/firebase/admin.ts));
set it to `preview` on Vercel's **Preview** environment and previews stop
touching live data. The live site leaves it unset (the default database).

- **Set-up, once:** create a Firestore database named `preview` in the
  `geekdomdotcom` project (Firebase console → Firestore → add database), set
  `FIREBASE_DATABASE_ID=preview` for Preview in Vercel, redeploy, then
  `npm run preview:seed` ([scripts/seed-preview-data.mjs](scripts/seed-preview-data.mjs)).
- **The seed copies content, never people:** events, portfolio and settings
  (the photo-wall manifest, email copy, member resources). Never members,
  applications or activity — and never `fieldNotes`, because a note's
  files live under its id in the one Blob store every deployment shares:
  deleting a copied note in a preview would delete the live note's photos.
  It only fills EMPTY collections, so running it again changes nothing.
- **Still shared, by design:** Firebase Auth (one sign-in for every
  deployment — adding a member in a preview creates a real login, which has
  no role on the live site without a live `members` record), Vercel Blob,
  and Firebase Storage. Hence:
- **The photo-wall sync refuses to run on preview data** — a sync deletes
  the Blob files its own manifest no longer needs, which on a preview under
  a changed grade would be the live wall's files.
- **Cache keys carry the database** (`dataKey()`): unchanged for the
  default, suffixed for a named one, so a preview's reads can never be
  served from — or into — the live site's cached data.
- **The admin shows no "Live data" / "Preview data" banner** — it came off
  at Jesse's request. Remember it yourself: local dev (`.env.local`) and any
  preview without `FIREBASE_DATABASE_ID` edit the LIVE database.

## Repo gotchas

- **Middleware is `proxy.ts` now** (Next 16 renamed it). Creating a
  `middleware.ts` gets you a file that silently never runs. `/portal/*`
  guarding lives in [proxy.ts](proxy.ts) **and** is re-verified in the portal
  and admin layouts, in every page, every admin route handler, and every
  server action — the proxy only checks that a cookie *exists*, never that
  it's valid. Don't treat it as the gate.

  **And never let it redirect on the cookie's presence alone.** It used to
  send the login page inside whenever a cookie existed; with an expired
  or revoked cookie that looped with the layout's redirect forever, and
  "Staff sign in" looked like a page that wouldn't load. `/sign-in` now
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

- **A member is created by the Stripe webhook (Solo, Team), by an approved
  Enterprise application, or by staff — never by a client redirect.**
  `/welcome` is a dumb landing page anyone can visit; it deliberately reads
  and writes nothing. The webhook also records the plan (from checkout
  metadata), stamps the application `paidAt`, and sends the branded welcome.

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

- **Admin API routes check the ROLE, not "signed in".** `getSessionUser()`
  returns members too since they can sign in; use `requireAdminApi()`. The
  CSV export used `getSessionUser()` and let any member download the whole
  roster and every application until it was caught.

- **Every route that calls `isBot()` must be listed in
  [instrumentation-client.ts](instrumentation-client.ts)'s `protect`.**
  Unlisted, the browser never sends BotID's signal and production flags
  every real visitor as a bot. `/api/auth/email-link` shipped unlisted:
  the form said "Check your inbox" and no sign-in link ever left
  production. It can't show up locally — there the check fails open.

- **`checkBotId()` throws when it can't reach its backend** — outside the Vercel
  runtime it reports a missing `x-vercel-oidc-token`. Unhandled that's a 500 on
  every submission, real applicant and bot alike. Call `isBot()` from
  [lib/botid.ts](lib/botid.ts), which fails **open** on an infrastructure error
  and still rejects a positively identified bot; the reasoning is written out
  there.

- **Fifteen years of old URLs are mapped in `LEGACY_REDIRECTS`**
  ([next.config.ts](next.config.ts)), built from the Internet Archive's index
  of geekdom.com: of ~3,900 archived paths, ~3,250 now land on a real
  counterpart and ~600 404 on purpose. The rule: redirect only to a page that
  answers the same question — everything-to-the-homepage is a soft 404.
  Individual blog posts, tag/author/date archives and WordPress internals
  404 until Field Notes exists. Three traps: redirects run BEFORE `public/`
  is served, so a source must never cover a folder there (`/portfolio/:path*`
  once sent every homepage logo to /studio — check `ls public`); a
  `/x/:path*` source also matches `/x` itself, so a live page's legacy
  children use `:path+` or loop; and
  the old subdomains (members., jobs., coworking., forum., events.…) have
  `has: host` rules that do nothing until each host is added to the Vercel
  project with DNS pointed here.

- **robots names the crawlers on purpose.** A bot obeys its own group and
  ignores `*`, so every agent sits in ONE group with the same disallows —
  never give one a group of its own without copying them.

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

**The press brand kit is generated, not hand-made.** `npm run brand:kit`
([scripts/brand-kit.mjs](scripts/brand-kit.mjs)) writes the wordmark, G mark
and crown in Red, Graphite and Bone (SVG + PNG) and a ZIP to
`public/brand/kit/`, from the flattened `*-mask.svg` outlines — /media shows
and serves those files. The two-tone originals Geekdom supplied (Red plus a
#AA2D29 shade) are not in the kit: the guide allows the marks "only in
Geekdom Red, Graphite, or Bone". If Geekdom sends official single-color
files, they replace these. Don't edit the kit by hand; re-run the script.

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
