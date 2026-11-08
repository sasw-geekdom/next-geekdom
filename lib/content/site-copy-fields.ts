import {
  CLUB,
  CLUB_HOME,
  CONTACT_BLOCKS,
  LOCATION,
  POSITIONING,
  STUDIO,
  STUDIO_CRITERIA,
  TAGLINE_LINE,
} from "@/lib/site";
import { BENEFITS, GENEROSITY_BAR, GOOD_FIT } from "@/lib/membership";

/*
  THE SITE'S EDITABLE WORDS — every piece of public-page text Geekdom can
  change in the admin (Site content → Site copy) without a developer. The
  scope of work's CMS line: "maintain website content without developer
  assistance" (November 2026).

  WORDS, NOT LAYOUT. Each field is one heading, one paragraph or one list,
  sized to its slot (`max`), so an edit can change what a section says but
  not break how it's built. The DEFAULT is the text the page shipped with —
  a field nobody has edited shows it, and "Reset to original" returns to it.

  DELIBERATELY NOT HERE (fixed in code, and the admin screen says why):
    · the members letter on /whats-changing — sent to members as written;
    · /terms and /privacy — legal text, changed by whoever owns it legally;
    · prices and plans — they come from PLANS so they can't drift from billing;
    · email addresses, the street address and the Studio's fund figures in
      lib/site.ts — facts several pages share;
    · page titles and search descriptions (SEO), photos, section order.

  PURE: the admin screen, the server action and the pages all read it.
*/

export const COPY_PAGES = [
  { id: "home", label: "Home", path: "/" },
  { id: "club", label: "The Club", path: "/club" },
  { id: "studio", label: "Studio", path: "/studio" },
  { id: "about", label: "About", path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
  { id: "apply", label: "Apply", path: "/apply" },
] as const;
export type CopyPageId = (typeof COPY_PAGES)[number]["id"];

/** line: one line (a heading, a label). text: a paragraph. list: one item per line. */
export type CopyKind = "line" | "text" | "list";

export interface CopyField {
  key: string;
  page: CopyPageId;
  section: string;
  label: string;
  kind: CopyKind;
  max: number;
  default: string;
  /** Shown under the field in the admin — a token, or a styling rule. */
  hint?: string;
}

const HEADING = 120;
const LEDE = 320;
const PARA = 900;

const line = (page: CopyPageId, section: string, key: string, label: string, def: string, max = HEADING, hint?: string): CopyField => ({ key, page, section, label, kind: "line", max, default: def, hint });
const text = (page: CopyPageId, section: string, key: string, label: string, def: string, max = PARA, hint?: string): CopyField => ({ key, page, section, label, kind: "text", max, default: def, hint });
const list = (page: CopyPageId, section: string, key: string, label: string, items: readonly string[], hint?: string): CopyField => ({ key, page, section, label, kind: "list", max: 1600, default: items.join("\n"), hint: hint ?? "One item per line." });

const openPrograms = `${STUDIO.openPrograms.slice(0, -1).join(", ")}, and ${STUDIO.openPrograms.at(-1)?.toLowerCase()}`;
const contact = (i: number) => CONTACT_BLOCKS[i];

export const COPY_FIELDS = [
  // ─── Home ─────────────────────────────────────────────────────────────────
  line("home", "Hero", "home.hero.headline", "Headline", POSITIONING, 90),
  text("home", "Hero", "home.hero.tagline", "Tagline", TAGLINE_LINE, 200, "Set in Fraunces italic."),
  line("home", "Hero", "home.hero.caption", "Caption under the tagline", `${LOCATION.floor}, ${LOCATION.building.replace(/^The /, "")}. Houston Street.`, 80),
  line("home", "The Club", "home.club.eyebrow", "Label", "Community", 30),
  line("home", "The Club", "home.club.title", "Title", "The Club", 40),
  text("home", "The Club", "home.club.subhead", "Subhead", CLUB_HOME.subhead, 160),
  text("home", "The Club", "home.club.body", "Body", CLUB_HOME.body, 520),
  line("home", "The Club", "home.club.cta", "Link", "Explore the Club", 40),
  line("home", "Studio", "home.studio.eyebrow", "Label", "Venture", 30),
  line("home", "Studio", "home.studio.title", "Title", "Studio", 40),
  text("home", "Studio", "home.studio.subhead", "Subhead", "A venture layer for the founders going all in.", 160),
  text("home", "Studio", "home.studio.body", "Body", `We back ${STUDIO.foundersPerYear} founders a year with ${STUDIO.checkRange} ${STUDIO.checkTerms} checks from the Community Fund and hands-on work from our EIR. Not an accelerator. Not a cohort. A serious commitment to a small number of founders building toward scale.`, 520),
  line("home", "Studio", "home.studio.cta", "Link", "Explore Studio", 40),
  line("home", "This month in the Club", "home.month.title", "Title", "This month in the Club", 60),
  line("home", "This month in the Club", "home.month.link", "Calendar link", "Explore our public events calendar", 60),
  line("home", "Since 2011", "home.origin.title", "Title", "Geekdom started with an email.", 80),
  text("home", "Since 2011", "home.origin.body", "Body", "In 2009, Graham Weston received an email from a founder that said San Antonio was missing a startup and tech community. Geekdom was born as the answer. Today, it powers the next generation of venture companies in San Antonio and the builders behind them.", 600),
  line("home", "Since 2011", "home.origin.link", "Link", "Read our story", 40),
  line("home", "Since 2011", "home.origin.caption", "Photo caption", "Graham Weston and Nick Longo, 2011", 80),
  line("home", "Close", "home.close.title", "Title", "Building something?", 60, "A closing “?” is set in Clay."),
  text("home", "Close", "home.close.body", "Body", "Membership is by application. It’s how we get to know you. Our team reads every one and follows up personally.", 320),
  line("home", "Close", "home.close.cta", "Button", "Apply to Geekdom", 40),

  // ─── The Club ─────────────────────────────────────────────────────────────
  line("club", "Header", "club.hero.eyebrow", "Label", "The Club · Members only", 50),
  line("club", "Header", "club.hero.headline", "Headline", CLUB.headline, 100),
  text("club", "Opening", "club.opening.lede", "Lede", CLUB.opening[0], LEDE),
  text("club", "Opening", "club.opening.p1", "Paragraph 2", CLUB.opening[1]),
  text("club", "Opening", "club.opening.p2", "Paragraph 3", CLUB.opening[2]),
  text("club", "Opening", "club.opening.p3", "Paragraph 4", CLUB.opening[3]),
  line("club", "The rhythm", "club.rhythm.eyebrow", "Label", "The rhythm", 40),
  text("club", "The rhythm", "club.rhythm.p1", "Paragraph 1", "The Club runs on a monthly rhythm of programming — socials, meetups, office hours, build sessions — plus special events open to members first."),
  text("club", "The rhythm", "club.rhythm.p2", "Paragraph 2", "Beyond the space, we’re building the online layer too: a member Slack, a directory, and a portal so the community keeps working when you’re not in the building."),
  line("club", "Who the Club is for", "club.who.eyebrow", "Label", "Who the Club is for", 40),
  line("club", "Who the Club is for", "club.who.title", "Title", "The bar is generosity.", 80),
  text("club", "Who the Club is for", "club.who.quote", "Pull line", GENEROSITY_BAR, 200, "Set large in Fraunces italic."),
  text("club", "Who the Club is for", "club.who.p1", "Paragraph 1", "We’re looking for people who show up for the community, not just for themselves."),
  text("club", "Who the Club is for", "club.who.p2", "Paragraph 2", "Our members are eclectic. Engineers, tinkerers, founders, investors, tech workers, students, senior operators—builders of all breeds. We lean into a give first culture where everyone is willing to help the person next to them. We show up with curiosity, ambition, and a belief that no good idea gets built alone."),
  line("club", "Who the Club is for", "club.who.fitTitle", "List title", "A good fit", 40),
  list("club", "Who the Club is for", "club.who.fit", "A good fit", GOOD_FIT),
  line("club", "The clubhouse", "club.house.eyebrow", "Label", "The clubhouse", 40),
  line("club", "The clubhouse", "club.house.title", "Title", "The third floor is where the Club lives.", 80),
  text("club", "The clubhouse", "club.house.body", "Body", "A place you come to do your best thinking, have your most important conversations, and be around people who raise your game — in the historic Rand Building downtown, where San Antonio builders have been gathering for over a decade."),
  line("club", "The clubhouse", "club.house.link", "Calendar link", "Browse the calendar", 40),
  line("club", "Membership", "club.membership.eyebrow", "Label", "Membership", 40),
  line("club", "Membership", "club.membership.title", "Title", "Application-based.", 60),
  line("club", "Membership", "club.membership.includedTitle", "List title", "What’s included", 40),
  list("club", "Membership", "club.membership.included", "What’s included", BENEFITS.map((b) => b.title)),
  text("club", "Membership", "club.membership.billing", "Under the plans", "Billed monthly. Nothing is charged until you’re accepted, and you can cancel any time.", 240),
  line("club", "Membership", "club.membership.cta", "Button", "Apply for membership", 40),
  text("club", "Membership", "club.membership.note", "Under the button", "Applications are read by a person on the Geekdom team. If it’s a fit, we’ll email you to start your membership.", 240),
  line("club", "Host an event", "club.host.eyebrow", "Label", "Host an event", 40),
  line("club", "Host an event", "club.host.title", "Title", "Bring your team to Geekdom.", 80),
  text("club", "Host an event", "club.host.body", "Body", "You don’t need to be a member to host here. Companies book Geekdom à la carte — for a day away from the office, a working session, or an evening with their customers.", 500),
  list("club", "Host an event", "club.host.kinds", "Kinds of events", ["Team offsites", "Planning and strategy days", "Workshops and trainings", "Client and partner events"]),
  text("club", "Host an event", "club.host.note", "Small print", "For company and team events — we don’t host private parties.", 200),
  line("club", "Host an event", "club.host.cta", "Link", "Plan an event", 40),

  // ─── Studio ───────────────────────────────────────────────────────────────
  line("studio", "Header", "studio.hero.eyebrow", "Label", "Studio", 40),
  line("studio", "Header", "studio.hero.headline", "Headline", "Where we go all in with the founders we believe in.", 100),
  line("studio", "Header", "studio.hero.tagline", "Tagline", "More than a check. More than mentorship.", 100, "Set in Fraunces italic."),
  text("studio", "Opening", "studio.opening.lede", "Lede", "Geekdom Studio is where we back a small number of San Antonio founders each year with capital, hands-on operator support, and access to the people who make the work go faster.", LEDE),
  text("studio", "Opening", "studio.opening.p1", "Paragraph 2", "The focus is on go-to-market, product, and getting founders connected to customers, operators, and investors."),
  text("studio", "Opening", "studio.opening.p2", "Paragraph 3", "There’s no open application and no cohorts. Founders are scouted and invited. Club membership isn’t a prerequisite, but most Studio relationships start there."),
  text("studio", "Opening", "studio.opening.p3", "Paragraph 4", "Beyond the portfolio, the Studio also runs open programming throughout the year — Office Hours, Startup Bootcamp, and select workshops — for the broader community."),
  line("studio", "Leading the Studio", "studio.eir.eyebrow", "Label", "Leading the Studio", 40),
  text("studio", "Leading the Studio", "studio.eir.p1", "Paragraph 1", `${STUDIO.eir.name} leads the Studio. He co-founded TeamPassword in 2012, bootstrapped it alongside a day job for four years, went full-time in 2016, and sold it to San Antonio’s Jungle Disk in 2018. He’s spent the years since shipping products, writing about SaaS, and working alongside founders in the city.`),
  text("studio", "Leading the Studio", "studio.eir.p2", "Paragraph 2", "He works with Studio companies the way he built his own — sleeves up, on the specific work that turns early traction into real scale."),
  text("studio", "Leading the Studio", "studio.eir.quote", "Pull quote", "Early-stage startups need one thing: money. They get it from customers, investors, and partners. We help them land all three.", 260, "Set in Fraunces italic."),
  line("studio", "Who we invest in", "studio.invest.eyebrow", "Label", "Who we invest in", 40),
  text("studio", "Who we invest in", "studio.invest.lede", "Lede", "We focus on local founders and startups well positioned to sell into local corporate partners, work with senior operator talent in our networks, and receive follow-on funding from local investors.", LEDE),
  list("studio", "Who we invest in", "studio.invest.criteria", "What we look for", STUDIO_CRITERIA),
  line("studio", "Capital", "studio.capital.eyebrow", "Label", "Capital", 40),
  line("studio", "Capital", "studio.capital.title", "Title", "The check is just the starting point.", 80),
  text("studio", "Capital", "studio.capital.p1", "Paragraph 1", `The ${STUDIO.fund} is how we make our initial investment in each Studio company.`),
  text("studio", "Capital", "studio.capital.p2", "Paragraph 2", "The local corporate, operator, and investor relationships make the next round or contract possible. Our goal is to get you to capital and customers faster than you can on your own."),
  line("studio", "Studio Companies", "studio.companies.eyebrow", "Label", "Studio Companies", 40),
  line("studio", "Open to the community", "studio.open.eyebrow", "Label", "Open to the community", 40),
  text("studio", "Open to the community", "studio.open.p1", "Paragraph 1", `The Studio hosts a small amount of open programming each year — ${openPrograms}. These are open to the broader community, not just Studio companies.`),
  text("studio", "Open to the community", "studio.open.p2", "Paragraph 2", "If you’re building something and wondering whether the Studio might be a fit, come to a public event and apply to the Club."),
  line("studio", "Built with", "studio.partners.eyebrow", "Label", "Built with", 40),
  text("studio", "Built with", "studio.partners.lede", "Lede", "The Studio is supported by partners who believe San Antonio’s founder community is worth investing in.", LEDE),
  line("studio", "How to get involved", "studio.involved.eyebrow", "Label", "How to get involved", 40),
  line("studio", "How to get involved", "studio.founder.title", "Founders · title", "If you’re a founder", 60),
  text("studio", "How to get involved", "studio.founder.p1", "Founders · paragraph 1", "The Studio isn’t something you apply to directly. We scout founders and companies to be invited in. The best Studio investments start as relationships."),
  text("studio", "How to get involved", "studio.founder.p2", "Founders · paragraph 2", "Club membership isn’t a prerequisite, but most Studio relationships start there."),
  line("studio", "How to get involved", "studio.founder.link", "Founders · events link", "See upcoming events", 40),
  line("studio", "How to get involved", "studio.founder.deck", "Founders · before the email", "Or introduce yourself — send your deck to", 120, "The Studio's email address follows it."),
  line("studio", "How to get involved", "studio.partner.title", "Partners · title", "If you’re a corporate partner", 60),
  text("studio", "How to get involved", "studio.partner.body", "Partners · body", "We work with a small number of corporate partners each year to support Studio companies with pilots, talent access, and follow-on introductions. If that sounds like a fit, we’d like to talk."),
  line("studio", "How to get involved", "studio.partner.cta", "Partners · link", "Contact us", 40),

  // ─── About ────────────────────────────────────────────────────────────────
  line("about", "Header", "about.hero.tagline", "Line under the title", "Geekdom started with an email.", 100, "The title, “Since 2011.”, is fixed."),
  line("about", "Founding", "about.founding.eyebrow", "Label", "Founding", 40),
  line("about", "Founding", "about.email.title", "The email · title", "The email", 60),
  text("about", "Founding", "about.email.p1", "The email · paragraph 1", "In 2009, a founder whose company Rackspace had just acquired sent Graham Weston a now-infamous email explaining why he wasn’t moving to San Antonio. The city, he wrote, had no startups and no developers to speak of."),
  text("about", "Founding", "about.email.p2", "The email · paragraph 2", "That email set Graham on the path that led to Geekdom."),
  line("about", "Founding", "about.born.title", "Born · title", "The place where startups are born", 80),
  text("about", "Founding", "about.born.p1", "Born · paragraph 1", "Graham brought in Nick Longo to help build what came next. Together they visited New York, Philadelphia, and San Francisco to see how the strongest startup communities actually worked. In 2011, they opened Geekdom downtown with a single promise: be the place where startups are born."),
  text("about", "Founding", "about.born.p2", "Born · paragraph 2", "Soon after, Geekdom hosted Techstars Cloud, which brought founders from around the world to San Antonio."),
  text("about", "Founding", "about.born.p3", "Born · paragraph 3", "From the beginning, the point wasn’t the space. It was the people the space brought together. Founders met their co-founders here. Developers joined companies that went on to raise, hire, and build in San Antonio — Parlevel, Promoter.io, FloatMe, PorchPass, and more."),
  line("about", "Where we are now", "about.now.eyebrow", "Label", "Where we are now", 40),
  text("about", "Where we are now", "about.now.lede", "Lede", "Geekdom is on a mission to build San Antonio one startup at a time.", LEDE),
  text("about", "Where we are now", "about.now.p1", "Paragraph 1", "{years} years in, we’ve gone from providing a place to work to deliberately building a place where companies get built.", PARA, "{years} is filled in for you (Fifteen, Sixteen…) — keep it in."),
  text("about", "Where we are now", "about.now.p2", "Paragraph 2", "Today, Geekdom has two parts. The Club is the community for the people building San Antonio’s future — founders, engineers, creators, operators, and the corporate and civic leaders who want a hand in what the city becomes. The Studio is where we go all in with a small number of founders each year, investing through our Community Fund and working alongside them for the next six to twelve months."),
  text("about", "Where we are now", "about.now.p3", "Paragraph 3", "Around the Club and Studio, we run a few things that make the whole ecosystem stronger. We operate LaunchSA with the City of San Antonio, the open front door for anyone starting something. We helped create Accelerate South Texas, a fund at the San Antonio Area Foundation that supports the organizations serving entrepreneurs across the region. And we run San Antonio Startup + Tech Week every fall to give our community a bigger stage."),
  text("about", "Where we are now", "about.now.p4", "Paragraph 4", "Founders rarely succeed alone. So we bring entrepreneurs, investors, universities, corporations, and local government together to clear the path for startups in San Antonio. We’re one part of a broader startup community, and we work to make every part of it stronger."),
  text("about", "Where we are now", "about.now.close", "Closing line", "The email named what San Antonio was missing. We made it our mission.", LEDE),
  line("about", "Get in touch", "about.contact.eyebrow", "Label", "Get in touch", 40, "The contact rows below it are edited on the Contact page."),

  // ─── Contact ──────────────────────────────────────────────────────────────
  line("contact", "Header", "contact.hero.title", "Title", "Get in touch.", 60),
  line("contact", "Contacts", "contact.membership.title", "Membership · title", contact(0).heading, 60),
  text("contact", "Contacts", "contact.membership.body", "Membership · text", contact(0).body, 240, "The email address follows it."),
  line("contact", "Contacts", "contact.partners.title", "Partnerships · title", contact(1).heading, 60),
  text("contact", "Contacts", "contact.partners.body", "Partnerships · text", contact(1).body, 240, "The email addresses follow it."),
  line("contact", "Contacts", "contact.press.title", "Press · title", contact(2).heading, 60),
  text("contact", "Contacts", "contact.press.body", "Press · text", contact(2).body, 240, "The link to the Media page follows it."),
  line("contact", "Contacts", "contact.general.title", "General · title", contact(3).heading, 60),
  text("contact", "Contacts", "contact.general.body", "General · text", contact(3).body, 240, "The email address follows it."),
  line("contact", "Location", "contact.location.eyebrow", "Label", "Location", 40),
  line("contact", "Location", "contact.location.directions", "Directions", `Elevator to the ${LOCATION.floor.toLowerCase()}.`, 160),
  line("contact", "Location", "contact.location.link", "Maps link", "Open in Maps", 40),

  // ─── Apply ────────────────────────────────────────────────────────────────
  line("apply", "Header", "apply.hero.title", "Title", "Apply to Geekdom.", 60, "The last word is set in Clay."),
  line("apply", "Header", "apply.hero.tagline", "Tagline", "Membership is by application. We respond within two weeks.", 120, "Set in Fraunces italic."),
  text("apply", "Header", "apply.hero.body", "Body", "Geekdom is a members’ club for serious founders and builders in San Antonio. The application takes about ten minutes. Our team reads every application. We reply personally either way.", 400),
  line("apply", "Header", "apply.hero.note", "Under the button", "About ten minutes, one question at a time.", 100),
] as const satisfies readonly CopyField[];

export type CopyKey = (typeof COPY_FIELDS)[number]["key"];

export const COPY_BY_KEY: Record<string, CopyField> = Object.fromEntries(COPY_FIELDS.map((f) => [f.key, f]));

/** The editable title and text of CONTACT_BLOCKS[i] — /contact and /about share them. */
export const CONTACT_COPY_KEYS = [
  { title: "contact.membership.title", body: "contact.membership.body" },
  { title: "contact.partners.title", body: "contact.partners.body" },
  { title: "contact.press.title", body: "contact.press.body" },
  { title: "contact.general.title", body: "contact.general.body" },
] as const satisfies readonly { title: CopyKey; body: CopyKey }[];
