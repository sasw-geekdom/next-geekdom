import type { Partner } from "@/lib/site";

/**
 * The logo wall — real marks, provisional list.
 *
 * Names and logo files are pulled from the live sasw.co "Powering the current"
 * wall, which is Startup Week's lineup. That makes them REAL organisations with
 * REAL marks — good enough to judge the layout honestly — but it does not make
 * them Geekdom's. Geekdom co-runs Startup Week, so the overlap is large and the
 * final list still has to come from Geekdom. Geekdom's own mark was in the
 * source list and is dropped here: nobody is their own partner.
 *
 * ONE LIST, not two. It was split into corporate members and community
 * partners, mirroring Startup Week's sponsor/partner tiers — but that split is
 * an internal distinction about how each relationship is funded, and a visitor
 * reading a logo wall does not care. Tiering also ranks them, which invites the
 * question of who paid for the top row. The reference site runs one row for the
 * same reason.
 *
 * Geekdom's own mark was in the source list and is dropped: nobody is their own
 * partner.
 *
 * FOUR MARKS USE AN `-on-light` VARIANT. Startup Week runs on black, so the
 * files it hosts are white artwork — The Creative Futures, Velocity TX, 80/20
 * Foundation and Students + Startups all disappear on sand. Rather than box
 * them or invert the whole row, each was recoloured to ink with its brand
 * accent preserved: the orange in Velocity TX, the bronze in 80/20, the pink
 * in Students + Startups. Originals are kept beside them for any dark ground.
 *
 * HEIGHTS ARE AREA-BALANCED, and they are calculated rather than judged.
 *
 * One height for everything was tried and is objectively wrong for this set:
 * the aspect ratios run from 7.4:1 (Launch SA) to 0.8:1 (The Creative Futures),
 * so at a shared 48px Launch SA rendered 357px wide against 39px — a NINE-fold
 * spread. Equal heights and equal visual weight cannot both hold.
 *
 * So height is derived from aspect: `h = 40 * (2.0 / aspect) ** 0.4`, clamped
 * to 28–52px and snapped to Tailwind's 4px step. The 0.4 exponent is a
 * deliberate softening of the 0.5 that would equalise area exactly — full
 * balance flattens a wide wordmark into a sliver. That brings the rendered
 * width spread from 9x down to under 5x (43–208px).
 *
 * Recalculate rather than nudge if a logo is added: the numbers are in the
 * commit that introduced this.
 */

/**
 * Everyone on the wall, ordered so the row reads well rather than by tier —
 * a wide wordmark next to a compact badge, alternating, so no two similar
 * shapes sit together.
 */
export const MOCK_PARTNERS: readonly Partner[] = [
  { name: "H-E-B Supplier Diversity", logo: "/partners/h-e-b-supplier-diversity.png" , height: "h-10 sm:h-13" },
  { name: "DEVSA", logo: "/partners/devsa.png" , height: "h-9 sm:h-12" },
  { name: "80/20 Foundation", logo: "/partners/80-20-foundation-on-light.svg" , height: "h-5 sm:h-7" },
  { name: "Tech Bloc", logo: "/partners/tech-bloc.svg" , height: "h-8 sm:h-11" },
  { name: "Launch SA", logo: "/partners/launch-sa.png" , height: "h-5 sm:h-7" },
  { name: "Velocity TX", logo: "/partners/velocity-tx-on-light.png" , height: "h-8 sm:h-11" },
  { name: "Students + Startups", logo: "/partners/students-startups-on-light.svg" , height: "h-5 sm:h-7" },
  { name: "Tech Port SA", logo: "/partners/tech-port-sa.png" , height: "h-7 sm:h-9" },
  { name: "Accelerate South Texas", logo: "/partners/accelerate-south-texas.webp" , height: "h-9 sm:h-12" },
  { name: "The Creative Futures", logo: "/partners/the-creative-futures-on-light.png" , height: "h-10 sm:h-13" },
];
