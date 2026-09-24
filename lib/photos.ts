import type { StaticImageData } from "next/image";

import welcomeHero from "@/public/photos/welcome-hero.jpg";
import theFloor from "@/public/photos/the-floor.jpg";
import theFloorWide from "@/public/photos/the-floor-wide.jpg";
import byTheWindows from "@/public/photos/by-the-windows.jpg";
import speaking from "@/public/photos/speaking.jpg";
import theRoom from "@/public/photos/the-room.jpg";
import theCafe from "@/public/photos/the-cafe.jpg";
import dropIn from "@/public/photos/drop-in.jpg";
import makeAPoint from "@/public/photos/make-a-point.jpg";
import pitch from "@/public/photos/pitch.jpg";
import oneOnOne from "@/public/photos/one-on-one.jpg";
import brianWhiteboard from "@/public/photos/brian-whiteboard.jpg";
import brianPortrait from "@/public/photos/brian-sierakowski.jpg";
import franklinMorris from "@/public/photos/franklin-morris.jpg";
import workshopWednesday from "@/public/photos/workshop-wednesday.jpg";
import openlaneTeam from "@/public/photos/openlane-team.jpg";
import grahamNick from "@/public/photos/graham-nick-2011.jpg";
import conversation from "@/public/photos/conversation.jpg";
import headsDown from "@/public/photos/heads-down.jpg";
import programming from "@/public/photos/programming.jpg";
import fireside from "@/public/photos/fireside.jpg";
import fullHouse from "@/public/photos/full-house.jpg";
import theCrowd from "@/public/photos/the-crowd.jpg";
import pysaTalk from "@/public/photos/pysa.jpg";
import pysaTables from "@/public/photos/pysa4.jpg";

/**
 * The photography.
 *
 * EVERY ONE OF THESE WAS SHOT ON THE THIRD FLOOR. That is the whole reason they
 * are in the repo rather than anything bought or borrowed: the site's central
 * claim is that the club is this specific room and the specific people in it,
 * and stock photography would quietly contradict that on every page. Anyone
 * who has been to Geekdom will recognize the reclaimed wood, the tiled cafe
 * wall, and the striped banquettes.
 *
 * Which means: if a replacement is ever needed, it has to come from the same
 * floor. A generic "people collaborating" frame would undo the argument the
 * copy is making.
 *
 * PROVENANCE — three shoots, all on the third floor:
 *
 *   1. "More Human Than Human," run by DEVSA, a Geekdom partner. Its branding
 *      is visible on the screens in several frames, and that is cleared: a
 *      partner filling this room is part of what the site claims, not a
 *      distraction from it. DEVSA is who to ask for more of these.
 *   2. "Hustle & Socialize 2024" — CREDIT: Lucero Salinas Photography.
 *      `byTheWindows` and `speaking` come from this set. Attribution is owed if
 *      these are used anywhere the site can't carry it implicitly.
 *   3. An unattributed panel shoot (`theFloorWide`) — track down the credit
 *      before using it off-site.
 *
 * The first shoot skews heavily male; the second is where most of the room's
 * actual range comes from. Worth keeping that balance in mind when swapping
 * frames, since "who is in the room" is the argument the site is making.
 *
 * These are also identifiable people in close-up. Anything added here needs the
 * same release coverage — an event-photography permission does not always
 * extend to a homepage.
 *
 * Imported statically rather than referenced by path string. Static imports
 * give next/image the intrinsic width and height at build time (so no layout
 * shift) and generate a blurDataURL for the placeholder — neither of which it
 * can infer from `src="/photos/x.jpg"`.
 */
export interface Photo {
  src: StaticImageData;
  /**
   * Alt text.
   *
   * Written to describe what is actually happening in the frame, because in
   * these images the activity IS the content — "people in an office" would
   * strip out the entire reason the photo was chosen. Kept free of "photo of",
   * which screen readers already announce.
   */
  alt: string;
}

export const PHOTOS = {
  /**
   * The frame the homepage opens on — not in the hero, which is type only, but
   * in the full-width band directly beneath it.
   *
   * This is the WHOLE photograph (2180×1454). It used to be cropped at 62% to
   * 1352×1454, which removed the second figure and left one man standing alone.
   * That crop existed for a layout that no longer exists: the old hero laid a
   * headline across the frame, and the second person read as a stranger's back
   * behind the type. With no type on the image, the crop's only reason is gone
   * — and uncropped it shows two members greeting each other, which is the
   * site's actual claim rather than a man by himself.
   *
   * Note it puts a SECOND identifiable person on the homepage, so the release
   * question in the header comment applies to them too.
   */
  /*
    CURRENTLY UNUSED. It led the homepage as a full-bleed band under the hero
    until that band was removed — see the note in app/(site)/page.tsx. Kept
    because it is the warmest frame in the library and /about or /club will
    want it: two members greeting each other with a room applauding around
    them, which is the site's whole argument in one picture.
  */
  welcomeHero: {
    src: welcomeHero,
    alt: "Two Geekdom members greeting each other on the third floor, with a room of seated members applauding around them.",
  },

  /**
   * The floor in use — a fireside chat, the room listening. The establishing
   * shot for the clubhouse section on /club, chosen over a purely
 * architectural frame because the
   * page argues the room is the people in it, not the square footage.
   */
  /**
   * The floor itself, not an event on it. It led /the-floor before that page
   * was retired; it now opens the clubhouse section on /club.
   *
   * It replaced a tight shot of two speakers in the cafe, which showed a talk
   * happening rather than the room it happened in. The page's headline is "One
   * floor. All of it pointed at one thing", and this is the frame that argues
   * it: ceiling ducts and pendant lights overhead, the glass meeting room, the
   * reclaimed wood, and tables running back to the windows.
   *
   * NOBODY IS FEATURED IN IT, and that is a requirement rather than a
   * preference. Two people sit at the front but they are small and distant, and
   * the whole foreground is backs of heads — the room is the subject. Every
   * other wide frame in both shoots has an identifiable person presenting, and
   * a previous choice had to be pulled for exactly that reason.
   *
   * It also suits BleedHero specifically: the foreground is dark and the
   * daylight sits high and right, so the scrim carries the type without dimming
   * the part of the picture worth seeing.
   */
  theFloor: {
    src: theFloor,
    alt: "The third floor from the back: long shared tables under pendant lights and exposed ducts, windows down one side looking onto downtown, members seated throughout.",
  },

  /**
   * The full width of the floor from the back — industrial ceiling, windows on
   * two sides, downtown behind them, every table taken.
   *
   * Kept distinct from `theFloor` so the homepage and /club don't open on
   * the identical photograph.
   */
  theFloorWide: {
    src: theFloorWide,
    alt: "The third floor from the back: pendant lamps, exposed ductwork, tall windows onto downtown San Antonio, and a full audience at long tables facing a panel.",
  },

  /**
   * The room at rest rather than mid-event — long tables, people talking across
   * them, downtown rooftops through the windows.
   *
   * Nothing else in the set showed what it is simply like to BE on the floor
   * between programming, which is most of what a membership actually buys.
   */
  byTheWindows: {
    src: byTheWindows,
    alt: "Members talking across long wooden tables beside tall windows looking onto downtown San Antonio rooftops.",
  },

  /** A member speaking to a seated group, the cafe wall behind her. */
  speaking: {
    src: speaking,
    alt: "A member speaking to a seated group on the third floor, the tiled cafe wall and windows behind her.",
  },

  /** A member with a hand raised, others listening. */
  theRoom: {
    src: theRoom,
    alt: "A member raising a hand to ask a question, with several others around the table listening.",
  },

  theCafe: {
    src: theCafe,
    /*
      THE FRAME CHANGED TWICE AND THE SECOND ONE IS WHY IT IS HERE.

      It was a 1600px shot of the tile wall with members standing at the
      counter — handsome, but the people were secondary and the lower third
      was out-of-focus heads. The archive's 2180px original of that same frame
      replaced it, and then this did: two members in a one-to-one across the
      counter, a drink and a pizza box between them, the kitchen and the tiled
      wall through the doorway behind.

      IT MATCHES WHAT THE CAFE IS FOR — coffee chats, the conversation that
      turns into a co-founder or a customer. A photograph of the counter is
      the furniture; this is the conversation.

      Natively 1.69, not the 1.50 most of the archive is, so a 4:5 tile crop
      leaves 1033px against the tile's ~1064 at 2x. Three percent under, and
      still more than the 854 the first file could give.
    */
    alt: "Two members talking across the cafe counter on Geekdom's third floor, a pizza box and a drink between them, the tiled wall and kitchen visible through the doorway behind.",
  },

  dropIn: {
    src: dropIn,
    alt: "A member working alone on a laptop on a striped banquette beneath the tall windows.",
  },

  makeAPoint: {
    src: makeAPoint,
    alt: "A member mid-sentence, gesturing to make a point across a long shared table.",
  },

  pitch: {
    src: pitch,
    alt: "A member standing with a laptop, presenting to a seated room.",
  },

  /**
   * Two members talking at a high-top by the windows.
   *
   * Replaced an earlier three-person frame that featured the same man as
   * `headsDown` — the two sat side by side under "Think it through" and
   * "Build it" on the homepage, which read as one person's day rather than a
   * room full of different people. Check new additions against the frames
   * already on the same page.
   */
  oneOnOne: {
    src: oneOnOne,
    alt: "Two members talking at a high table by the windows, downtown San Antonio behind them.",
  },

  /** Black and white — reads well against the ink bands. */
  conversation: {
    src: conversation,
    alt: "Two people in close conversation in the long room, in black and white.",
  },

  headsDown: {
    src: headsDown,
    alt: "A member working at a laptop with a hand on their chin, thinking, with others working nearby.",
  },

  /** Two speakers mid-laugh during a fireside chat. */
  fireside: {
    src: fireside,
    alt: "Two speakers laughing during a fireside chat on the third floor, members watching from close by.",
  },

  /**
   * 2011. GRAHAM WESTON AND NICK LONGO, under the original wall.
   *
   * The two people in the origin story, photographed in the place the story
   * happened: Nick emailed Graham to say San Antonio was missing a startup
   * community, and Geekdom was the answer. It runs in the homepage's "Geekdom
   * started with an email" section, where it replaced a shader g-mark — a
   * decorative mark standing in for a story that has an actual photograph.
   *
   * THE WALL BEHIND THEM IS THE POINT AS MUCH AS THEY ARE. It carries the
   * ORIGINAL logo — the light wordmark with the spiky crown, the same mark the
   * footer's easter-egg door wears — and the first tagline, "The Place Where
   * Startups Are Born." A brand's own history, legible in the background of
   * its founding photograph, is exactly the "vintage… throwback" frame the
   * 2026 guide asks the library for and had none of.
   *
   * ⚠️ THIS FILE IS AN AI UPSCALE, AND IT SAYS SO ITSELF. It is 2730x1536,
   * generated from the original 800x450 web export, and it carries an
   * embedded C2PA manifest signed by Google:
   *
   *     c2pa.opened    "Opened by Google Generative AI"
   *     c2pa.resized   "Resized by Google Generative AI"
   *     digitalSourceType: …/digitalsourcetype/trainedAlgorithmicMedia
   *
   * No EXIF, no camera make or model, no ICC profile — a camera original
   * carries all three. Shipped on an explicit decision after the tradeoff was
   * put in writing; recorded here so nobody later mistakes it for a negative
   * scan.
   *
   * WHAT SURVIVED AND WHAT DIDN'T. Checked against the original before
   * install: the crown's five points and their spacing, the glasses frame, the
   * shirt buttons and the lapel all correspond, so the composition and both
   * faces are structurally the real photograph. What the model invented is the
   * table — the business card and the printed strip are an illegible blur in
   * the source and crisp, readable-looking text here. That text is fiction.
   * Any future crop should prefer the upper two thirds.
   *
   * THE REAL FIX IS STILL THE ORIGINAL. The 800px file was plainly a web
   * export of something larger, and Geekdom took the photograph — the camera
   * file exists somewhere. Swapping it in needs nothing but this constant.
   */
  /*
    THE TWO STUDIO FRAMES THAT ARE NOT THE THIRD FLOOR.

    The "same floor" rule in the note at the top of this file is scoped to CLUB
    imagery on purpose, and these are why. The Studio does not sell a room — it
    sells six to twelve months of one person's attention — so a photograph of
    that person, and of a company he backed, is more on-point than a floor
    neither of them may be standing on.

    `brianPortrait` came from the sibling next-sasw repo, where he is a Startup
    Week speaker; it is the headshot his speaker page serves, at 1080x1350. Its
    alpha is flattened onto Bone here rather than kept, because a transparent
    PNG punches a hole in any section whose ground is not bone.

    `openlaneTeam` is the Openlane founders at their own whiteboard, lifted out
    of a composed SVG Geekdom supplied — two tilted, white-bordered, drop-
    shadowed frames layered over each other. The composition was left behind
    deliberately: rotation and paper borders are not in this design system, and
    the photograph inside it is the part with the value. It twins with
    `brianWhiteboard` on the homepage, which is the same act one company over.

    IT IS THE /studio HERO NOW, under the same ramp the homepage and /club use,
    and it won that slot on measurement. In the real treatment at 1440x760 with
    the image box inset to 38%, it holds Bone at 15.3:1 median and 6.0:1 at the
    single worst pixel across the copy column — AA for body with room. Centred,
    not left-anchored: `object-left` cuts the man on the right in half at the
    frame edge.

    `brianWhiteboard` LOST THAT COMPARISON ON RESOLUTION. It is the more
    on-message frame and it measures well, but the camera original is 1200px
    against the ~2380 device px a full-bleed fold wants at 2x — half of what
    the slot needs, where this frame's 1600 is merely short. That is the whole
    of it now: the other two objections at the time, a crop that decapitated
    both men and an upscaler that misspelled Brian's name, were properties of
    the AI upscale that used to stand in for it and are gone with it.
  */
  brianPortrait: {
    src: brianPortrait,
    alt: "Brian Sierakowski, Geekdom's Entrepreneur in Residence, photographed in portrait.",
  },

  /**
   * THE FOUNDER IN THE FILM, so the one first-hand account on the site has a
   * face attached to its name.
   *
   * Same source and same treatment as `brianPortrait`: the sibling next-sasw
   * repo, where its speaker data names this file as Franklin Morris, and the
   * alpha flattened onto Bone because a transparent PNG punches a hole in any
   * section whose ground is not bone. 1080x1350, so 4:5, and it is cropped to
   * a circle at 64px in the film row.
   *
   * ⚠️ HIS HAIR IS SHORTER HERE THAN IN THE FILM, which is worth knowing
   * before somebody re-opens it as a mismatch. Checked side by side against
   * the film's own frame: same brow, nose and beard, hair pushed back and
   * longer on camera. The naming comes from next-sasw's speaker data rather
   * than from that comparison — a Geekdom-adjacent source rather than a guess.
   */
  franklinMorris: {
    src: franklinMorris,
    alt: "Franklin Morris, founder of KeepTabz, photographed in portrait.",
  },

  /**
   * THE OPEN PROGRAMMING, ACTUALLY HAPPENING — and it is the same man as
   * `franklinMorris`, which is the point rather than a coincidence.
   *
   * /studio claims a Studio company's founder teaches sessions that anyone
   * can walk into. This is that claim photographed: Franklin mid-sentence, a
   * slide reading "The right time", and a whiteboard that says WORKSHOP
   * WEDNESDAY, his name, and MARKETING STRATEGY / STARTUPS.
   *
   * IT IS ALSO WHAT CONFIRMED HIS IDENTITY. The portrait came from next-sasw's
   * speaker data and his hair is shorter there than in the film; this frame
   * names him on the wall behind his own face, so the three are tied together
   * by something better than a resemblance.
   *
   * 1280x1706, a 0.75 portrait, cropped to 16:9 — and the crop lands almost
   * exactly on `object-center`: the frame that keeps him, the screen and the
   * seated row starts at y 470 and centre starts at 493 of 1706. So it needs
   * no `objectPosition`, which is the only reason a 0.75 source is safe in a
   * landscape slot here.
   */
  workshopWednesday: {
    src: workshopWednesday,
    alt: "Franklin Morris mid-sentence at a Geekdom workshop, a whiteboard behind him reading Workshop Wednesday, marketing strategy for startups, with founders seated at tables.",
  },

  openlaneTeam: {
    src: openlaneTeam,
    alt: "Two of Openlane's founders working at a glass whiteboard, one sketching a diagram while the other holds a marker.",
  },


  grahamNick: {
    src: grahamNick,
    alt: "Graham Weston and Nick Longo sitting together in 2011 beneath Geekdom's original wall sign, which reads \"Welcome to geekdom — The Place Where Startups Are Born.\"",
  },

  /**
   * THE ONE PHOTOGRAPH NOT SHOT ON THE THIRD FLOOR, and the exception is
   * deliberate.
   *
   * Every other frame in this file is from the Rand, because the site's claim
   * about the CLUB is that it is this specific room. The Studio is not a
   * room-based product — what it sells is six to twelve months of one person's
   * attention — so a photograph of that person doing the work is more on-point
   * than a photograph of the floor he isn't necessarily on.
   *
   * It replaced `oneOnOne` in the homepage's Studio section, which showed two
   * members talking by the windows. That frame illustrates the CLUB well and
   * the Studio hardly at all: the section's promise is "hands-on work from our
   * Entrepreneur in Residence", and this is literally that — Brian at a
   * whiteboard with a founder, both holding markers, mid-argument about a
   * product.
   *
   * IT IS BRIAN, ELEVEN YEARS YOUNGER — and the file's own EXIF settles it:
   * NIKON D3100, 2 February 2015. Worth writing down because the comparison
   * invites doubt. Put this frame beside `brianPortrait` and they read as two
   * different men: the portrait has darker, slicked hair, a trimmed goatee
   * and a sharper jaw, this has brown hair and a full beard. Geekdom
   * confirmed it. Don't reopen it, and don't let it cast doubt on the
   * homepage caption that names him.
   *
   * THIS IS THE CAMERA ORIGINAL. An AI upscale of it sat here for a while and
   * caused enough trouble to be worth recording, because the same shortcut
   * will look tempting again:
   *
   *   - It carried a C2PA manifest signed by Google — "Opened by Google
   *     Generative AI", digitalSourceType trainedAlgorithmicMedia — on the
   *     homepage of a brand whose guide says "Real people, named. No stock."
   *   - IT REWROTE HIS NAME. The whiteboard here reads "Brian Sierakowski";
   *     the upscale rendered it "Brian Siiewkowski", and because the upscale
   *     was sharper the misspelling was MORE legible than the real writing.
   *     On the one section that names him in copy three lines away, that is a
   *     visible error about a real person, not a subtle provenance worry.
   *   - Avoiding it forced a crop that threw away most of the frame, and the
   *     crop is what made the photograph look cramped.
   *
   * The original needs none of that. 1200x802 — a 1.496 aspect, which is the
   * homepage slot's 3:2 to within a rounding error, so it drops in with
   * essentially no crop — and the whole sketch is legible: a profile wireframe
   * with Connections and Experience, "Cable Installer Salesman", "Hard Rock
   * Guitarist", "API = from LI". That legibility is what makes the caption
   * "working a product problem" literally true rather than a description of a
   * gesture.
   *
   * ⚠️ 1200px IS ITS CEILING, and that has not changed. It covers 600 CSS px
   * at 2x, which is fine for the homepage's ~460px slot and nowhere near the
   * ~2380 device px a full-bleed hero wants. See the note beside
   * `openlaneTeam` for the hero comparison this lost.
   *
   * The 2015 date also answers a question this file used to carry open: the
   * styling reads older than the Geekdom shoots because it IS older — this is
   * Brian's TeamPassword years, not the Studio.
   */
  brianWhiteboard: {
    src: brianWhiteboard,
    alt: "Two men working at a whiteboard covered in a hand-drawn product wireframe, one sketching with a marker while the other points at the screen layout.",
  },

  /** A talk in progress — the programming frame in /club's clubhouse grid. */
  programming: {
    src: programming,
    alt: "A talk in progress on the third floor, a speaker in front of a screen and a seated audience.",
  },

  /** A full room mid-applause. The best evidence that the place gets used. */
  fullHouse: {
    src: fullHouse,
    alt: "A full room on the third floor applauding, people at every table and standing along the cafe counter.",
  },

  /*
    FROM THE PySA MEETUP — Python San Antonio, on the third floor, and a
    different evening and a different crowd from everything else here.

    Named for what it shows rather than for the file it arrived as. `pysa7`
    tells a future reader nothing, and the lesson from `theRoom` — which is
    not a room, it is four faces — is that a name people trust describes the
    frame.

    ONE OF FIVE WAS KEPT. The set is good and it is the only photography here
    of the floor genuinely PACKED, but the other four had no slot that got
    better by forcing them into it: the clubhouse grid is four captioned
    activities and a fifth orphans the row, and the rhythm section is
    deliberately type-led. Registering frames nothing renders is how
    `theFloorWide` ended up sitting in this file unused. The originals are in
    the Downloads directory when a slot wants them.

    NOT FOR A FULL-BLEED HERO. At 1603px it is the same class as the rest of
    the library, well under the 2180px frames — and tested under the hero ramp
    the whole set goes murky, because the warmth that makes it good is the
    first thing a heavy scrim takes.
  */
  pysaTalk: {
    src: pysaTalk,
    alt: "Two speakers presenting to a seated audience at a meetup on Geekdom's third floor, the room's reclaimed-wood wall and string lights behind them.",
  },

  /*
    THE ONLY EVENING FRAME IN THE LIBRARY, which is why it is here rather than
    one of the other three that were tried in the same slot. Everything else is
    daylight, so in a row of tiles it is the one that does not blend into its
    neighbours.
  */
  pysaTables: {
    src: pysaTables,
    alt: "Long tables on Geekdom's third floor filled with people at a evening meetup, one person in the foreground with a hand raised, downtown visible through the windows behind.",
  },

  theCrowd: {
    src: theCrowd,
    alt: "A speaker addressing a packed room from beside the cafe counter, every table occupied.",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
