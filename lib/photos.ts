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
import grahamNick from "@/public/photos/graham-nick-2011.jpg";
import conversation from "@/public/photos/conversation.jpg";
import headsDown from "@/public/photos/heads-down.jpg";
import programming from "@/public/photos/programming.jpg";
import fireside from "@/public/photos/fireside.jpg";
import fullHouse from "@/public/photos/full-house.jpg";
import theCrowd from "@/public/photos/the-crowd.jpg";

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
    alt: "The Geekdom cafe counter, tiled wall behind it, members standing and talking over coffee.",
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
   * ⚠️ AN AI UPSCALE, AND CROPPED FOR A REASON. Like `grahamNick`, this file
   * carries a C2PA manifest signed by Google — "Opened by Google Generative
   * AI", "Resized by Google Generative AI", digitalSourceType
   * trainedAlgorithmicMedia. It was generated from the 1198x799 original.
   *
   * THE UPSCALER REWROTE BRIAN'S NAME. The whiteboard in the original reads
   * "Brian Sierakowski"; in the upscale it reads "Brian Siiewkowski" — and
   * because the upscale is sharper, the misspelling is MORE legible than the
   * correct spelling ever was. On the one section of the site that names him
   * in the copy three lines away, a photograph spelling him wrong is not a
   * subtle provenance worry, it is a visible error about a real person.
   *
   * So the file here is cropped right of it: `extract` at 980,380 for
   * 1548x1032, which keeps both men, the marker, the gesture and the real
   * board text ("Maryland", "USA") and excludes the fabricated surname
   * entirely. DO NOT RE-CROP LEFTWARD without checking what the handwriting
   * says — everything upstream of x=1180 in the source is suspect.
   *
   * Also still worth confirming: the styling reads older than the Geekdom
   * shoots, so this may date from Brian's TeamPassword years rather than the
   * Studio.
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

  theCrowd: {
    src: theCrowd,
    alt: "A speaker addressing a packed room from beside the cafe counter, every table occupied.",
  },
} as const satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
