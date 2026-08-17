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
 * who has been to Geekdom will recognise the reclaimed wood, the tiled cafe
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
   * The hero frame, and the only one cropped rather than used whole.
   *
   * The full photograph has a second figure in black on the right, mid-greeting.
   * Cutting the frame at 62% removes them completely and leaves one subject —
   * the man in the short-sleeve polo — with the bank of seated members
   * applauding behind him. That crop is baked into the FILE on purpose: the
   * hero element changes shape a lot between a 1024px laptop and a 4K TV, and
   * no combination of width and object-position could keep that second figure
   * out of frame at every size.
   *
   * Cropping left it nearly square (1352×1454, 0.93), which happens to match
   * the hero element's shape on desktop almost exactly — so very little of it
   * is lost there.
   */
  welcomeHero: {
    src: welcomeHero,
    alt: "A Geekdom member smiling mid-greeting on the third floor, with a room of seated members applauding behind him.",
  },

  /**
   * The floor in use — a fireside chat, the room listening. The establishing
   * shot for /the-floor, chosen over a purely architectural frame because the
   * page argues the room is the people in it, not the square footage.
   */
  theFloor: {
    src: theFloor,
    alt: "Two speakers with microphones seated at the front of the third floor, an audience listening from long shared tables.",
  },

  /**
   * The full width of the floor from the back — industrial ceiling, windows on
   * two sides, downtown behind them, every table taken.
   *
   * Kept distinct from `theFloor` so the homepage and /the-floor don't open on
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

  /** A talk in progress — the build-sessions frame on /the-floor. */
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
