# Geekdom

The application for **Geekdom** — a membership club for serious founders and
builders in San Antonio. Public site plus a gated staff portal, built for the
Geekdom team.

> _"Make people your unfair advantage."_

Starting in October, Geekdom stops being a coworking space and becomes a club.
One membership, **$100/month**. No dedicated desks. No offices. The site tells
that story, takes applications, and runs the membership behind it.

### The positioning

Every tool pitch this year says to make software your unfair advantage. Geekdom's
argument is that the advantage was always the person sitting next to you — which
is also what the members letter says, from the other direction. The copy leads
with that claim (`HOOK`), follows with what you do about it (`PROMISE` — "Find
your thinking partner"), and treats the third floor as the evidence.

The one rule: **the thinking partner is a person, in a room.** Not a tool, not a
platform. See the Voice section of [AGENTS.md](AGENTS.md).

---

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **Geist Sans + Geist Mono** (variable, self-hosted via `next/font`)
- **npm** · Node **≥ 20.19** (`.nvmrc`)
- **Firebase** (`geekdomdotcom`) — browser SDK for staff auth, **Admin SDK** for
  all data; **Firestore** (default database); **Storage** for assets
- **Stripe** — one recurring membership price, Checkout + the hosted billing portal
- **Resend** — branded transactional email
- **Luma** — powers the events section
- **Vercel BotID** — invisible CAPTCHA on both public POST endpoints

## How the membership actually works

The flow is apply-first, because who's in the room is the product:

1. Someone applies at **`/apply`** → validated (zod) → written to Firestore →
   confirmation email to them, notification to the team.
2. Staff review in the portal at **`/admin/applications`**.
3. **Approve** mints a Stripe Checkout session and emails the applicant an
   invitation containing that link. Approving twice does not send two links.
4. They check out. **The Stripe webhook** — not the success redirect — creates
   the `members` record and sends the welcome email.
5. Members manage billing at **`/account`** by requesting a portal link by email.
   There is no member login: possession of the inbox is the proof of identity,
   and the endpoint answers identically for unknown addresses so it can't be
   used to test who belongs to the club.

Membership is **$100/month**, set once in `MEMBERSHIP_PRICE_CENTS` in
[lib/membership.ts](lib/membership.ts) and rendered everywhere through
`priceLabel()` — the pricing card, `/apply`, the FAQ, the invitation email, and
the search-result descriptions. **Never type a dollar figure into copy.**

Nothing enforces that this constant matches the Stripe price it mirrors
(`STRIPE_MEMBERSHIP_PRICE_ID`); the constant is display copy and Stripe decides
what the card is actually charged. Change both together. Setting it back to
`null` is supported and makes every surface fall back to "pricing coming soon"
with the apply-first flow intact.

## Features

### Public site (`app/(site)`)

- **`/`** — the pitch: the hook, the mission, how the room works, who's in it,
  the origin story, what's included, and what's on. Auto-aging transition banner
  that counts down to the September 25 contract wind-down and switches to past
  tense on its own.
- **`/membership`** — what the one membership includes, what it explicitly isn't.
- **`/the-floor`** — the third floor and the rhythm that fills it.
- **`/events`** — the Luma calendar, server-rendered and indexable, ISR at 5 min.
- **`/whats-changing`** — the letter to members, reproduced in full.
- **`/faq`** — the practical questions the letter raises.
- **`/apply`**, **`/account`**, **`/welcome`** — the membership flow.
- SEO: metadata, `next/og` share card, `robots.txt`, `sitemap.xml`, legacy
  redirects from the coworking-era site.

### Staff portal (`app/admin`, gated)

- **Auth** — Google sign-in restricted to the `@geekdom.com` workspace, plus a
  superadmin escape hatch. Sessions are Admin-SDK-verified httpOnly cookies.
- **Dashboard** — application and membership counts, 14-day application chart.
- **Applications** — filterable queue, full detail view, staff notes, and a
  decision panel that sends the right email for each outcome.
- **Members** — roster with subscription status, renewal dates, and deep links
  into Stripe (billing changes belong in Stripe's own UI, not a copy of it).
- **Events** — read-only view of the Luma calendar.
- CSV export for applications and members, formula-injection safe.

## Getting started

**Prerequisites:** Node **≥ 20.19** (`nvm use`).

```bash
npm install
npm run dev          # http://localhost:3000
```

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

## Environment

Copy [.env.example](.env.example) to `.env.local` and fill it in. On Vercel, set
the same keys in **Project Settings → Environment Variables**.

The app is built so that a missing key degrades rather than crashes: every SDK
client is constructed lazily, `/events` falls back to a link to the public Luma
calendar, and email failures never fail the request that triggered them. The
build itself needs no secrets.

### Stripe setup

1. Create a **recurring price** for the membership → `STRIPE_MEMBERSHIP_PRICE_ID`.
2. Add a webhook endpoint at `https://<your-domain>/api/stripe/webhook`
   subscribed to `checkout.session.completed` and `customer.subscription.*`.
   Its signing secret is `STRIPE_WEBHOOK_SECRET`.
3. Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. Enable the **billing portal** in the Stripe dashboard, or `/account` 500s.

### Luma setup

API keys are **per calendar** and require Luma Plus. Create one at
`luma.com/calendar/manage/api-keys` → `LUMA_API_KEY`.

### BotID

`/api/apply` and `/api/billing/portal` are gated by `checkBotId()`. It needs no
keys, but it **only enforces on Vercel** — under `next dev` it always reports
"not a bot" so the forms stay usable locally. That also means a local pass
proves nothing; verify on a deployment. The protected paths are declared twice
and must be kept in step: [instrumentation-client.ts](instrumentation-client.ts)
arms the client signal, and each route handler calls `checkBotId()` itself. A
path listed in only one place looks protected and isn't.

Enable BotID in the Vercel project's **Firewall** settings after deploying.

### Security rules

Firestore and Storage are deny-all to the client SDK
([firestore.rules](firestore.rules), [storage.rules](storage.rules)) — all
access goes through the Admin SDK server-side. Deploy them with:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

You will also need a composite index on `applications` (`status` ASC,
`createdAt` DESC) for the filtered admin queue. Firestore's error message links
straight to the one-click creation form the first time you filter.

## Project structure

```
app/
  (site)/            # public site
  admin/             # login + gated staff portal
  api/               # auth session, apply, billing portal, Stripe webhook, exports
  opengraph-image.tsx, robots.ts, sitemap.ts
components/          # ui primitives, site, admin, forms, auth
lib/
  firebase/          # Admin + client init, collection schemas
  auth/              # roles, sessions, guards
  admin/             # queries, server actions, nav, CSV
  stripe/            # client, checkout, portal
  email/             # Resend client, templates
  validation/        # zod schemas
  site.ts            # identity, dates, nav
  membership.ts      # the one membership: price, benefits, audiences
  luma.ts            # the events API
proxy.ts             # /admin/* fast-path guard (Next 16 renamed middleware → proxy)
```

> **Note:** this project tracks a fast-moving Next.js. When in doubt, read the
> bundled guides in `node_modules/next/dist/docs/` — and read
> [AGENTS.md](AGENTS.md) before changing anything in the list of gotchas there.
