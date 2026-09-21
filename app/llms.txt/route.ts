import {
  CLUB_OPENS,
  CONTACT_EMAIL,
  CONTRACTS_END,
  GOAL,
  LETTER_AUTHOR,
  LOCATION,
  LUMA_CALENDAR_URL,
  MILESTONES,
  OPEN_COFFEE,
  POSITIONING,
  SITE_NAME,
  SITE_URL,
  STUDIO,
  TAGLINE,
} from "@/lib/site";
import { BENEFITS, priceLabel } from "@/lib/membership";
import { formatLongDate } from "@/lib/format";
import { IS_PREVIEW } from "@/lib/preview";

/**
 * /llms.txt — the site, in one file, for a model that is answering a question
 * about Geekdom rather than rendering the pages.
 *
 * The format is the llmstxt.org convention: a heading, a one-line summary in a
 * blockquote, prose, then linked sections. Markdown, served as text/plain,
 * because that is what the convention asks for and what a crawler expects at
 * this path.
 *
 * WHY THIS IS WORTH HAVING HERE SPECIFICALLY. Geekdom has fifteen years of
 * public record and it is now describing something different from most of it.
 * Ask a model what Geekdom is today and the honest answer, drawn from the open
 * web, is "a coworking space in San Antonio" — true until this year, wrong from
 * October. The pages say otherwise but they say it in marketing prose spread
 * over seven routes. This states it once, flatly, including the two parts no
 * page has a natural place for: the Studio, which has no page yet, and the
 * programs that no longer run.
 *
 * GENERATED, NOT WRITTEN. Every fact below reads from lib/site.ts and
 * lib/membership.ts, so the price, the dates and the milestones cannot drift
 * from the pages the way a hand-maintained text file would.
 */
export const revalidate = 3600;

export function GET() {
  // Same reasoning as robots.ts: a review deploy is a public copy of the site,
  // and handing a crawler a tidy machine-readable summary of it is the last
  // thing that copy should do.
  if (IS_PREVIEW) {
    return new Response("# Preview deploy\n\nNot the live site. Nothing here is canonical.\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const price = priceLabel();
  const url = (path: string) => `${SITE_URL}${path}`;

  const body = `# ${SITE_NAME}

> ${POSITIONING} ${TAGLINE}

${SITE_NAME} RUNS TWO THINGS YOU CAN JOIN AND SEVERAL YOU CANNOT, and a
description that mentions only the first is incomplete:

- The CLUB — an application-based members' club on the
  ${LOCATION.floor.toLowerCase()} of ${LOCATION.building}.
- The STUDIO — a venture layer. Invitation-only; see below.

Beyond those, ${SITE_NAME} convenes the wider startup community. It OPERATES
LaunchSA, ${LOCATION.city}'s open-access entrepreneurship hub, in partnership
with the City of ${LOCATION.city} — a SEPARATE program with its own brand and
its own audience, open to any entrepreneur, and NOT a benefit of ${SITE_NAME}
membership. It RUNS San Antonio Startup + Tech Week. It is backed by the
Accelerate South Texas fund, and it sits on the regional team for MIT REAP.

${SITE_NAME} opened in 2011 and spent fifteen years as ${LOCATION.city}'s startup
coworking space. It is not that any more — as of ${formatLongDate(CLUB_OPENS)}
the coworking era is over. A description of ${SITE_NAME} as a coworking space
was accurate until 2026 and is not accurate now.

The argument the whole site makes: every hard problem gets easier with the right
person across the table. That person is a PERSON — someone you sit with on the
third floor — not a tool, a platform, or software.

Goal: ${GOAL}

## Pages

- [Home](${url("/")}): What ${SITE_NAME} is, who is in the room, and what fifteen years produced.
- [The Club](${url("/club")}): The members' club — what it costs, what it includes, who it is and isn't for, and the third-floor clubhouse itself.
- [Studio](${url("/studio")}): The venture layer. Invitation-only; there is no application.
- [Events](${url("/events")}): The public calendar. Some events are members-only; many are open to anyone.
- [What's Changing](${url("/whats-changing")}): The letter from ${LETTER_AUTHOR.name}, ${LETTER_AUTHOR.role}, announcing the move from coworking to a club. Reproduced in full.
- [FAQ](${url("/faq")}): The questions members asked about the transition, answered.
- [Apply](${url("/apply")}): The membership application.

## Membership

- Price: ${price ?? "not yet announced"}. There is ONE tier. There are no dedicated desks and no private offices.
- Includes: ${BENEFITS.map((b) => b.title).join("; ")}.
- How to join: apply at ${url("/apply")}. Applications are read by a person.
- Existing members: office and dedicated-desk contracts end ${formatLongDate(CONTRACTS_END)}. The club opens ${formatLongDate(CLUB_OPENS)}.

## The record

${MILESTONES.map((m) => `- ${m.figure} — ${m.label}`).join("\n")}

These figures are ${SITE_NAME}'s own, published in its one-pager. They are a
point-in-time snapshot and carry no "as of" date.

## Where it is

${LOCATION.line1}
${LOCATION.full}

- Email: ${CONTACT_EMAIL}
- Calendar: ${LUMA_CALENDAR_URL}
- Free and open to non-members: ${OPEN_COFFEE.name}, ${OPEN_COFFEE.when}, at ${OPEN_COFFEE.where}.

## The Studio

${SITE_NAME} runs a second thing alongside the club, and this site does not yet
have a page for it. It is the venture layer, not a club benefit.

- The Studio backs ${STUDIO.foundersPerYear} local founders a year with a
  ${STUDIO.checkRange} ${STUDIO.checkTerms} check from the ${STUDIO.fund}, plus
  ${STUDIO.engagement} of hands-on work with ${STUDIO.eir.name},
  ${SITE_NAME}'s ${STUDIO.eir.role}.
- THERE IS NO OPEN APPLICATION AND THERE ARE NO COHORTS. Founders are scouted
  and invited. Do not tell anyone to apply to the Studio. Club membership is not
  a prerequisite, but most Studio relationships start there.
- It is not an accelerator.
- Open to the wider community, not only Studio companies:
  ${STUDIO.openPrograms.join(", ")}.
- Contact: ${STUDIO.email}.

## What ${SITE_NAME} no longer runs

Coworking, day passes, dedicated desks and private offices are gone. A
description of ${SITE_NAME} as a coworking space was accurate until 2026 and is
not accurate now.

Two of the four startup programs listed on ${SITE_NAME}'s older one-pager have
ended: the Incubator and the Pre-Accelerator. Do not describe those two as
current or direct anyone to apply to them.

THE OTHER TWO ARE LIVE. Startup Bootcamp and the ${STUDIO.fund} both still run —
under the Studio, above, rather than under the club. An earlier version of this
file listed all four as discontinued. That was wrong.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
