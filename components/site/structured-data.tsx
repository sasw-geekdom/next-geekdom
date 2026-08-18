import {
  CONTACT_EMAIL,
  FOUNDED_YEAR,
  LOCATION,
  PROMISE,
  SITE_NAME,
  SITE_URL,
  SOCIALS,
} from "@/lib/site";
import { MEMBERSHIP_PRICE_CENTS } from "@/lib/membership";
import { IS_PREVIEW } from "@/lib/preview";

/**
 * JSON-LD. What the pages say, in the form a search engine can act on.
 *
 * `sameAs` is the load-bearing part and the reason this is worth adding at all.
 * Geekdom has fifteen years of profiles, directory entries and press under this
 * name; without an explicit list, the entity Google assembles from them is a
 * guess. Naming the four accounts Geekdom actually runs is what ties this
 * domain to that entity rather than to a similarly-named one.
 *
 * ORGANIZATION, NOT LOCALBUSINESS, and that is a deliberate limit. LocalBusiness
 * is the stronger type for a physical place — it is what feeds map results —
 * but it wants opening hours and a telephone number, and this repo has neither.
 * Inventing them to earn a richer schema type is how a club ends up with a
 * Google listing that sends someone to a locked door at 8pm. Worth revisiting
 * the day Geekdom confirms the club's hours and a public phone number.
 *
 * Rendered as a script tag rather than through Next's metadata API, which has
 * no JSON-LD field. `dangerouslySetInnerHTML` is the documented approach; every
 * value below is a constant from lib/, none of it is user input.
 */
export function SiteJsonLd() {
  // A review deploy is a full copy of the site. Describing it as the Geekdom
  // organisation, on a URL that isn't geekdom.com, points the entity at the
  // wrong domain — the same reasoning that keeps robots.txt closed there.
  if (IS_PREVIEW) return null;

  const graph = [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: `A membership club for founders and builders in ${LOCATION.city}. ${PROMISE}`,
      email: CONTACT_EMAIL,
      foundingDate: String(FOUNDED_YEAR),
      logo: `${SITE_URL}/brand/geekdom_logo_full.svg`,
      address: {
        "@type": "PostalAddress",
        streetAddress: LOCATION.street,
        addressLocality: LOCATION.city,
        addressRegion: LOCATION.state,
        postalCode: LOCATION.zip,
        addressCountry: "US",
      },
      sameAs: SOCIALS.map((s) => s.href),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
  ];

  return <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />;
}

/**
 * The membership itself, as an offer.
 *
 * Only rendered where the price is actually announced — an Offer with no price
 * is a worse signal than no Offer, because it invites a "price on application"
 * treatment for something that has a flat public number.
 */
export function MembershipJsonLd() {
  if (IS_PREVIEW || MEMBERSHIP_PRICE_CENTS === null) return null;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: `${SITE_NAME} membership`,
        serviceType: "Membership club for founders and builders",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: `${LOCATION.city}, ${LOCATION.state}`,
        url: `${SITE_URL}/membership`,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/apply`,
          price: (MEMBERSHIP_PRICE_CENTS / 100).toFixed(2),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: (MEMBERSHIP_PRICE_CENTS / 100).toFixed(2),
            priceCurrency: "USD",
            // One month, as a reference quantity — this is what marks the
            // figure as recurring rather than as a one-off joining fee. UN/CEFACT
            // "MON" is the unit code for a month.
            referenceQuantity: {
              "@type": "QuantitativeValue",
              value: 1,
              unitCode: "MON",
            },
          },
        },
      }}
    />
  );
}

/**
 * One event.
 *
 * Kept honest about what it does and doesn't know: no `offers` block, because
 * registration and price live on Luma and this side has no reliable view of
 * either. A schema that claims an event is free when Luma is charging for it is
 * worse than a schema with no price at all.
 */
export function EventJsonLd({
  name,
  description,
  startAt,
  endAt,
  url,
  image,
  location,
}: {
  name: string;
  description?: string;
  startAt: string;
  endAt: string;
  url: string;
  image?: string;
  location: string;
}) {
  if (IS_PREVIEW) return null;

  // Luma gives a free-text location. Anything that names the building is our
  // own floor and gets the real postal address; anything else is somebody
  // else's venue, and guessing its address would be inventing a fact.
  const onOurFloor = /geekdom|rand|houston/i.test(location);

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Event",
        name,
        description,
        startDate: startAt,
        endDate: endAt,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        url,
        ...(image ? { image: [image] } : {}),
        organizer: { "@id": `${SITE_URL}/#organization` },
        location: onOurFloor
          ? {
              "@type": "Place",
              name: `${SITE_NAME}, ${LOCATION.line1}`,
              address: {
                "@type": "PostalAddress",
                streetAddress: LOCATION.street,
                addressLocality: LOCATION.city,
                addressRegion: LOCATION.state,
                postalCode: LOCATION.zip,
                addressCountry: "US",
              },
            }
          : { "@type": "Place", name: location },
      }}
    />
  );
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // `<` escaped so a stray angle bracket in event copy from Luma cannot
      // close the script tag early. The rest of the payload is constants.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
