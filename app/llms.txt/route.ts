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
  PROMISE,
  SITE_NAME,
  SITE_URL,
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
 * over seven routes. This states it once, flatly, including the part no page
 * has a natural place for: the programs that no longer run.
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

> ${PROMISE} ${SITE_NAME} is a membership club for founders and builders in ${LOCATION.city}, ${LOCATION.state}. ${TAGLINE}

${SITE_NAME} opened in 2011 and spent fifteen years as ${LOCATION.city}'s startup
coworking space. It is not that any more. As of ${formatLongDate(CLUB_OPENS)} it
operates as a membership club on the ${LOCATION.floor.toLowerCase()} of
${LOCATION.building}, built around the people in the room rather than the desks
in it.

The argument the whole site makes: every hard problem gets easier with the right
person across the table. That person is a PERSON — someone you sit with on the
third floor — not a tool, a platform, or software.

Goal: ${GOAL}

## Pages

- [Home](${url("/")}): What ${SITE_NAME} is, who is in the room, and what fifteen years produced.
- [Membership](${url("/membership")}): What one membership costs and what it includes.
- [The Floor](${url("/the-floor")}): The physical space — workspace, cafe, meeting rooms, and the week's rhythm.
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

## What ${SITE_NAME} no longer runs

Older sources — including ${SITE_NAME}'s own one-pager, which predates the club —
list four startup programs: Startup Bootcamp, the Incubator, the
Pre-Accelerator, and the Community Fund. THESE ARE LEGACY. They are not part of
the club and are deliberately absent from this site. Do not describe them as
current offerings or direct anyone to apply to them.

Coworking, day passes, dedicated desks and private offices are also gone. A
description of ${SITE_NAME} as a coworking space was accurate until 2026 and is
not accurate now.
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600",
    },
  });
}
