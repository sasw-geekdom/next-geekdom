import { PHOTOS, type Photo } from "@/lib/photos";
import { STUDIO_FILM } from "@/lib/site";
import type { NoteImage, PublishedNote, RichDoc, RichNode } from "@/lib/field-notes/types";

/*
  SAMPLE FIELD NOTES — six invented notes so Geekdom can review the index
  and the note pages with something on them. REVIEW BUILDS ONLY (localhost
  and Vercel preview links; never geekdom.com — see `ON_LIVE_DOMAIN` and
  `listForReaders` in lib/field-notes/notes.ts), never in the sitemap or
  llms.txt, and every page that shows one says so.

  WHY NOT REAL NOTES IN FIRESTORE: the live site and every review build read
  the same database, so a "sample" published there would be public the day
  the page ships.

  THE RULES THESE KEEP: the stories are in Geekdom's voice but make no claim
  about a real company or person; the photographs are the graded library
  and the /since-2011 wall (real Geekdom frames, used as illustration —
  no caption names anyone);
  the sample AUTHORS get illustrated portraits, never photos — an invented
  name on a real face is an invented person (the same rule as the directory
  mocks).
*/

const img = (p: Photo, bw = false): NoteImage => ({
  src: p.src.src,
  srcSm: p.src.src,
  width: p.src.width,
  height: p.src.height,
  original: "",
  alt: p.alt,
  bw,
});

/*
  PHOTOS FROM THE /since-2011 WALL — its graded 1800px copies, copied into
  public/mock/field-notes/ (not linked from Blob: the wall's URLs change
  whenever its grade is bumped). Already through the brand grade, so they're
  used as they are. Chosen to skip other companies' branding and legacy
  program signage; no caption names anyone.
*/
const wall = (name: string, width: number, height: number, alt: string, bw = false): NoteImage => ({
  src: `/mock/field-notes/${name}.webp`,
  srcSm: `/mock/field-notes/${name}.webp`,
  width,
  height,
  original: "",
  alt,
  bw,
});

const avatar = (n: number, name: string): NoteImage => ({
  src: `/mock/avatars/m-${n}.svg`,
  srcSm: `/mock/avatars/m-${n}.svg`,
  width: 400,
  height: 400,
  original: "",
  alt: `${name} (illustrated sample portrait)`,
  bw: false,
});

const t = (text: string, marks?: RichNode["marks"]): RichNode => ({ type: "text", text, ...(marks ? { marks } : {}) });
const p = (...c: RichNode[]): RichNode => ({ type: "paragraph", content: c });
const h = (level: 2 | 3, text: string): RichNode => ({ type: "heading", attrs: { level }, content: [t(text)] });
const ul = (...items: string[]): RichNode => ({ type: "bulletList", content: items.map((i) => ({ type: "listItem", content: [p(t(i))] })) });
const ol = (...items: string[]): RichNode => ({ type: "orderedList", content: items.map((i) => ({ type: "listItem", content: [p(t(i))] })) });
const doc = (...content: RichNode[]): RichDoc => ({ type: "doc", content });

const CARD = "/opengraph-image.png";

function note(n: Omit<PublishedNote, "ogImage" | "previousSlugs" | "updatedAt" | "seo"> & { description: string }): PublishedNote {
  const { description, ...rest } = n;
  return { ...rest, updatedAt: n.publishedAt, ogImage: CARD, previousSlugs: [], seo: { title: "", description } };
}

export const MOCK_FIELD_NOTES: PublishedNote[] = [
  note({
    id: "sample-1",
    slug: "what-a-room-does-that-a-calendar-cant",
    title: "What a room does that a calendar can't",
    dek: "Every good hire on the third floor this year started as an argument at a long table.",
    author: "Dana Reyes",
    publishedAt: "2026-10-26T15:00:00.000Z",
    description: "Why the best introductions on Geekdom's third floor happen at the long tables, not on a calendar invite — and what founders do with them.",
    frames: [
      { id: "c", type: "cover", ground: "graphite", layout: "full", title: "What a room does that a calendar can't", dek: "Every good hire on the third floor this year started as an argument at a long table.", image: img(PHOTOS.theFloorWide), series: "The room │ Rituals", credit: "Photography by Geekdom" },
      { id: "t1", type: "text", ground: "bone", size: "large", doc: doc(p(t("You can schedule a meeting. You can't schedule the person who leans over and says, "), t("“I've seen this break before.”", [{ type: "italic" }]), t(" That only happens when you're in the same room, working on something real, close enough to overhear."))) },
      { id: "t1b", type: "text", ground: "bone", size: "large", doc: doc(h(2, "The overheard sentence."), p(t("Most useful conversations on the floor start with someone who wasn't invited to them. A founder talks through a pricing problem at the long table. Someone two seats down has solved it twice."))) },
      { id: "w1", type: "image", image: wall("long-table-laugh", 1800, 1200, "Two members laughing over a laptop at a shared table."), caption: "Mid-afternoon. Nobody scheduled this.", fit: "cover" },
      { id: "i1", type: "image", image: img(PHOTOS.makeAPoint), caption: "Wednesday, the long table by the windows.", fit: "cover" },
      { id: "t1c", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "What a calendar does well"), p(t("A calendar is good at the meetings you already know you need: the investor update, the weekly sync, the call with the lawyer. It is bad at the ones you don't know about yet.")), p(t("Those depend on being near people who are working on something hard, close enough to notice when your problem looks like theirs. A room doesn't replace the calendar. It catches what the calendar can't see."))) },
      { id: "q", type: "quote", ground: "graphite", text: "I came in for a desk. I stayed for the people who kept pulling up a chair.", attribution: "A member since the Weston Centre" },
      { id: "t1d", type: "text", ground: "graphite", size: "large", doc: doc(p(t("Three things we watched happen this year:")), ul("A first hire, met over lunch.", "A pricing page rewritten after a hallway argument.", "A raise nobody needed, talked down.")) },
      { id: "t2", type: "text", ground: "bone", size: "large", doc: doc(h(2, "So we stopped counting desks."), p(t("The question now is simpler: who did you meet this week, and what did they change about what you're building?"))) },
      { id: "t3", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "What we ask of members"), p(t("Come in on the days you'd otherwise work alone. Sit somewhere you'll be interrupted. When someone asks what you're working on, tell them the real version — the part that isn't working yet.")), p(t("The bar isn't impressiveness. ", [{ type: "bold" }]), t("It's generosity."))) },
      { id: "w2", type: "image", image: wall("hallway-catch-up", 1800, 1200, "Two women talking and smiling in a hallway between rooms."), caption: "The hallway counts as a room.", fit: "cover" },
      { id: "a", type: "author", ground: "bone", portrait: avatar(12, "Dana Reyes"), name: "Dana Reyes", role: "Community lead", company: "Geekdom", link: "/club" },
    ],
  }),
  note({
    id: "sample-2",
    slug: "five-questions-before-you-raise",
    title: "Five questions to answer before you raise",
    dek: "What the founders who raised well this year could answer in one sentence each.",
    author: "Marcus Lee",
    publishedAt: "2026-10-19T15:00:00.000Z",
    description: "Five questions founders should be able to answer in a sentence before they raise — from office hours on Geekdom's third floor.",
    frames: [
      { id: "c", type: "cover", ground: "graphite", layout: "full", title: "Five questions to answer before you raise", dek: "What the founders who raised well this year could answer in one sentence each.", image: img(PHOTOS.pitch), series: "Field guide │ Funding", credit: "Photography by Geekdom" },
      { id: "t1", type: "text", ground: "bone", size: "large", doc: doc(p(t("A raise doesn't start with a deck. It starts with five answers you can give without looking at one."))) },
      { id: "w1", type: "image", image: wall("pitch-anatomy", 1774, 1424, "A founder stands beside a screen titled Pitch Anatomy, waiting to speak."), caption: "Practice runs are cheaper than first meetings.", fit: "cover" },
      { id: "t2", type: "text", ground: "bone", size: "large", doc: doc(ul("Who pays you today, and why?", "What do they use instead when you're down?", "What happens in the next six months if you don't raise?", "Who on your team owns the number you're promising?", "What would make you walk away?")) },
      { id: "q1", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "1. Who pays you today, and why?"), p(t("Not who might. Who does. If the answer is a pilot, say what it's worth and what happens when it ends. An honest small number can be priced. A vague large one can't.")), h(3, "2. What do they use instead?"), p(t("Every customer did this some other way before you. Name it — a spreadsheet, a contractor, a competitor — and say why they wouldn't go back."))) },
      { id: "q2", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "3. What happens if you don't raise?"), p(t("The question founders skip most. If the honest answer is “we grow slower,” that's leverage. If it's “we close,” know it before the first meeting, not during it.")), h(3, "4. Who owns the number?"), p(t("A forecast without a name next to it is a hope. Say who on the team answers for each figure you're promising."))) },
      { id: "q3", type: "text", ground: "bone", size: "large", doc: doc(h(2, "5. What would make you walk away?"), p(t("Terms, a board seat, a timeline. Decide before you're in the room, while you can still think clearly about it."))) },
      { id: "w2", type: "image", image: wall("whiteboard-talk", 1758, 1404, "A speaker at a whiteboard talks to a small seated group.", true), caption: "The questions are the same every time. That's the point.", fit: "cover" },
      { id: "i1", type: "image", image: img(PHOTOS.oneOnOne, true), caption: "Office hours run long when the answers are short.", fit: "cover" },
      { id: "t3", type: "text", ground: "graphite", size: "large", doc: doc(p(t("If any of these takes a paragraph, that's the work. "), t("Not the deck.", [{ type: "bold" }]))) },
      { id: "t4", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "How to use this"), p(t("Write each answer in one sentence. Read all five to someone who doesn't know your company.")), p(t("Wherever they ask a follow-up question, that's the paragraph you're missing. Write it, then try again with someone else across the table."))) },
      { id: "w3", type: "image", image: wall("across-the-table", 1788, 1788, "Two founders talk across a table, laptops open."), caption: "Find someone who doesn't know your company.", fit: "cover" },
      { id: "a", type: "author", ground: "bone", portrait: avatar(27, "Marcus Lee"), name: "Marcus Lee", role: "Founder", company: "Sample company", link: "" },
    ],
  }),
  note({
    id: "sample-3",
    slug: "a-film-from-the-studio",
    title: "Building in public, on camera",
    dek: "A founder, a whiteboard and twelve months of hands-on help — in their own words.",
    author: "The Geekdom team",
    publishedAt: "2026-10-12T15:00:00.000Z",
    description: "A Geekdom film about building a company with the Studio's hands-on help, plus what we learned making it on the third floor.",
    frames: [
      { id: "c", type: "cover", ground: "graphite", layout: "full", title: "Building in public, on camera", dek: "A founder, a whiteboard and twelve months of hands-on help — in their own words.", image: img(PHOTOS.programming), series: "The Studio │ Film", credit: "Photography by Geekdom" },
      // The poster is the speaker, as on /studio's film row — not YouTube's
      // thumbnail, which is a designed title card (components/site/video-card).
      { id: "v", type: "video", video: { source: "youtube", id: STUDIO_FILM.youtubeId }, poster: img(PHOTOS.franklinMorris), caption: "Franklin Morris, founder of KeepTabz, in a Geekdom film." },
      { id: "t1", type: "text", ground: "bone", size: "large", doc: doc(p(t("We made this film to show what the Studio actually is: not a program you apply to, but months of someone sitting next to you while you figure it out."))) },
      { id: "t2", type: "text", ground: "bone", size: "large", doc: doc(h(2, "What the film shows."), p(t("No stage, no demo day. A whiteboard, a founder, and the same person across the table every week for months."))) },
      { id: "w1", type: "image", image: wall("lean-canvas", 1800, 1200, "A woman at a whiteboard beside a Lean Canvas on a screen, mid-explanation.", true), caption: "Week four. The canvas is mostly crossed out.", fit: "cover" },
      { id: "t3", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "What the Studio is"), p(t("The Studio backs a small number of founders each year with hands-on help: someone who has built companies before, working on yours week by week.")), p(t("There's no application and no cohort. Founders are invited."))) },
      { id: "w2", type: "image", image: wall("heads-down-desk", 1800, 1200, "A founder at a desk with two monitors, working through something."), caption: "Most of the work looks like this.", fit: "cover" },
      { id: "t4", type: "text", ground: "graphite", size: "regular", doc: doc(h(3, "What we learned making it"), p(t("We expected the interesting part to be the advice. It wasn't. It was the follow-up — the second and third conversation about the same problem, after the first answer turned out to be wrong.")), p(t("That's hard to film and easy to miss. It's most of the work."))) },
      { id: "a", type: "author", ground: "bone", name: "The Geekdom team", role: "", company: "Geekdom", link: "/studio" },
    ],
  }),
  note({
    id: "sample-4",
    slug: "hiring-your-first-engineer-in-san-antonio",
    title: "Hiring your first engineer in San Antonio",
    dek: "Where the good ones are, and why most of them aren't on a job board.",
    author: "Priya Shah",
    publishedAt: "2026-10-05T15:00:00.000Z",
    description: "Where San Antonio founders find their first engineer, why most good candidates aren't on job boards, and what to ask in the first conversation.",
    frames: [
      { id: "c", type: "cover", ground: "graphite", layout: "full", title: "Hiring your first engineer in San Antonio", dek: "Where the good ones are, and why most of them aren't on a job board.", image: img(PHOTOS.headsDown), series: "Field guide │ Talent", credit: "Photography by Geekdom" },
      { id: "t1", type: "text", ground: "bone", size: "large", doc: doc(p(t("Your first engineer is the hire you'll explain for the rest of the company's life. Most of the good ones are already working somewhere — and most of them came to a meetup this year."))) },
      { id: "t1b", type: "text", ground: "bone", size: "large", doc: doc(h(2, "Start before you need them."), p(t("The worst time to meet engineers is the week you post the role. Go to the meetups now. Ask people what they're building. You're not recruiting yet — you're learning who's good."))) },
      { id: "w1", type: "image", image: wall("over-the-shoulder", 1800, 1200, "One person leans over another's shoulder to look at a laptop screen."), caption: "The best interview is watching someone work.", fit: "cover" },
      { id: "q", type: "quote", ground: "bone", text: "I didn't post the role. I asked three people at Open Coffee who they'd hire.", attribution: "A founder on the third floor" },
      { id: "t1c", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "Where to look in San Antonio"), ul("Meetups on the third floor and around downtown.", "Engineers at larger local companies who want to build something earlier.", "People who moved home and work remotely for someone else.", "Your own users, if your product is technical.")) },
      { id: "w2", type: "image", image: wall("team-table", 1800, 1200, "A small team around a table covered in laptops, one person standing."), caption: "Small teams, long tables.", fit: "cover" },
      { id: "t2", type: "text", ground: "bone", size: "large", doc: doc(h(2, "Ask about the last thing they shipped."), p(t("Not the stack. The thing, the people it was for, and what they'd change."))) },
      { id: "t3", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "Questions worth asking"), ol("What's the last thing you shipped, and who used it?", "What would you change about it now?", "When did you last disagree with a manager, and what happened?", "What do you want to be doing in two years?")) },
      { id: "w3", type: "image", image: wall("focus", 1600, 980, "An engineer in a cap works at a laptop beside a monitor."), caption: "Hire for the thing they shipped.", fit: "cover" },
      { id: "t4", type: "text", ground: "graphite", size: "large", doc: doc(p(t("Hire the person who asks you hard questions back. ")), p(t("Your first engineer should argue with you.", [{ type: "bold" }]))) },
      { id: "a", type: "author", ground: "bone", portrait: avatar(41, "Priya Shah"), name: "Priya Shah", role: "Engineering lead", company: "Sample company", link: "" },
    ],
  }),
  note({
    id: "sample-5",
    slug: "the-night-the-floor-filled-up",
    title: "The night the floor filled up",
    dek: "A Thursday meetup, a hundred chairs, and the questions nobody had time to ask.",
    author: "Elena Cruz",
    publishedAt: "2026-09-28T15:00:00.000Z",
    description: "A Thursday night meetup on Geekdom's third floor, a full room, and the questions founders kept asking after the talk ended.",
    frames: [
      { id: "c", type: "cover", ground: "graphite", layout: "full", title: "The night the floor filled up", dek: "A Thursday meetup, a hundred chairs, and the questions nobody had time to ask.", image: img(PHOTOS.theCrowd, true), series: "The room │ Events", credit: "Photography by Geekdom" },
      { id: "i1", type: "image", image: img(PHOTOS.fullHouse), caption: "Every table, and people standing along the cafe counter.", fit: "cover" },
      { id: "t1", type: "text", ground: "bone", size: "large", doc: doc(p(t("The talk ended at eight. The room emptied at ten. The two hours in between were the part worth coming for."))) },
      { id: "t2", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "What people asked after"), ul("How did you find your first ten customers?", "When did you know it was time to hire?", "What would you do differently with your first raise?", "Who did you call when it wasn't working?")) },
      { id: "w1", type: "image", image: wall("hands-up", 1766, 1416, "A packed room around long tables, several people raising their hands."), caption: "Questions, after the questions ran out.", fit: "cover" },
      { id: "t3", type: "text", ground: "bone", size: "large", doc: doc(p(t("The last question got the longest answer. Nobody builds alone, and the room was full of people who already knew it."))) },
      { id: "w2", type: "image", image: wall("panel-night", 1800, 1200, "A panel on stage in front of the Geekdom wordmark, audience in the foreground.", true), caption: "The panel ended at eight.", fit: "cover" },
      { id: "i2", type: "image", image: img(PHOTOS.fireside), caption: "A fireside on the third floor.", fit: "cover" },
      { id: "t4", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "Why we keep the room open late"), p(t("The talk is the reason people come. The two hours after are the reason they come back.")), p(t("So we leave the lights on, the cafe counter open, and the chairs where they are. Come for the talk. Stay for the rest."))) },
      { id: "w3", type: "image", image: wall("fireside-crowd", 1800, 1351, "A seated crowd turned toward a speaker standing in the aisle."), caption: "Two hours later, still talking.", fit: "cover" },
      { id: "a", type: "author", ground: "bone", portrait: avatar(8, "Elena Cruz"), name: "Elena Cruz", role: "Member", company: "Geekdom Club", link: "/club" },
    ],
  }),
  note({
    id: "sample-6",
    slug: "the-same-table-fifteen-years-apart",
    title: "The same table, fifteen years apart",
    dek: "We went through the archive. The rooms changed. What happens in them didn't.",
    author: "The Geekdom team",
    publishedAt: "2026-10-22T15:00:00.000Z",
    // Pinned as the index's hero (Jesse's pick). Not the newest sample, so
    // it's in front only because it's featured — the pin, shown working.
    featured: true,
    description: "A walk through fifteen years of Geekdom photographs, and the one thing that shows up in nearly every frame: people leaning in to help.",
    frames: [
      { id: "c", type: "cover", ground: "graphite", layout: "full", title: "The same table, fifteen years apart", dek: "We went through the archive. The rooms changed. What happens in them didn't.", image: wall("the-building", 1800, 1422, "A brick downtown San Antonio building seen from the street, looking up."), series: "From the archive │ Since 2011", credit: "Photography from the Geekdom archive" },
      { id: "t1", type: "text", ground: "bone", size: "large", doc: doc(p(t("Geekdom opened in 2011. Since then we've changed floors, furniture and what we call ourselves. We went back through the photographs to see what stayed the same."))) },
      { id: "i1", type: "image", image: wall("archive-laughing", 1800, 1196, "Five people laughing together against a wall, mid-joke.", true), caption: "From the archive. Nobody remembers what was funny.", fit: "cover" },
      { id: "t2", type: "text", ground: "bone", size: "large", doc: doc(h(2, "People leaning in."), p(t("In almost every frame, someone is leaning toward someone else — over a laptop, a whiteboard, a table full of coffee cups."))) },
      { id: "i2", type: "image", image: wall("archive-stage-group", 1800, 1200, "A large group posing on and around a stage, some with arms raised.", true), caption: "One group photo of many.", fit: "cover" },
      { id: "t3", type: "text", ground: "bone", size: "regular", doc: doc(h(3, "What changed"), ul("The floors and the furniture.", "The programs we ran, and the ones we stopped.", "How many people fit in the room at once."), h(3, "What didn't"), p(t("Founders still come in with a problem they can't solve alone. They still find someone who's seen it before — usually by accident, usually at a table."))) },
      { id: "i3", type: "image", image: wall("archive-arms-up", 1534, 1534, "A packed room of people cheering with their arms in the air.", true), caption: "A full house, arms up.", fit: "cover" },
      { id: "q", type: "quote", ground: "graphite", text: "Every photo is someone helping someone else. We just didn't know that's what we were taking pictures of.", attribution: "The Geekdom team" },
      { id: "i4", type: "image", image: wall("archive-floor-group", 1800, 1440, "A group of members gathered for a photo among the desks and couches.", true), caption: "Different year, same idea.", fit: "cover" },
      { id: "t4", type: "text", ground: "graphite", size: "large", doc: doc(p(t("Were you in one of these? "), t("We'd like to hear what you remember.", [{ type: "bold" }]))) },
      { id: "a", type: "author", ground: "bone", name: "The Geekdom team", role: "", company: "Geekdom", link: "/club" },
    ],
  }),
];
