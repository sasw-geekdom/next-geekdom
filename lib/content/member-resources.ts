import "server-only";

import { unstable_cache } from "next/cache";
import { dataKey, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, MEMBER_RESOURCES_DOC } from "@/lib/firebase/collections";
import { MOCK_FAQ, MOCK_RESOURCES } from "@/data/mock/portal";

/*
  THE MEMBER PORTAL'S EDITABLE BASICS — the Slack invite, the Wi-Fi, the
  hours, the resource links and the FAQ. One doc, `settings/memberResources`,
  edited at /portal/admin/resources; read by /portal (the Slack tile) and
  /portal/resources.

  FALLS BACK TO THE TEXT THE PORTAL SHIPPED WITH (data/mock/portal.ts), never
  fails: before the first save there is no doc, and a build without
  credentials can't reach Firestore. The first save in the admin writes the
  whole thing, defaults included, so there is no "copy from the site" step.

  Cached and tagged like events; the fetch THROWS on error so a failure is
  never cached as the answer. Members-only data (the Wi-Fi password) lives
  here, but this cache is server-side, and both pages that read it check the
  session first.
*/

export const MEMBER_RESOURCES_TAG = "member-resources";

export const FAQ_GROUPS = ["The clubhouse", "Your membership"] as const;

export interface ResourceLinkItem {
  id: string;
  title: string;
  description: string;
  /** "" = coming soon. https:, mailto: or a site path. */
  href: string;
}

export interface FaqEntry {
  id: string;
  group: string;
  q: string;
  a: string;
  /** Still a placeholder Geekdom has to write or confirm. */
  confirm: boolean;
}

export interface MemberResources {
  /** "" = Slack isn't open yet. */
  slackInviteUrl: string;
  wifiNetwork: string;
  wifiPassword: string;
  hours: string;
  links: ResourceLinkItem[];
  faq: FaqEntry[];
  /** False until the first save — the portal is showing the shipped text. */
  saved: boolean;
}

export function defaultMemberResources(): MemberResources {
  return {
    slackInviteUrl: "",
    wifiNetwork: "",
    wifiPassword: "",
    hours: "Open 24/7 for members",
    // Slack has its own field (the dashboard tile reads it), so it isn't a link here.
    links: MOCK_RESOURCES.filter((r) => r.title !== "Member Slack").map((r, i) => ({
      id: `link-${i}`,
      title: r.title,
      description: r.description,
      href: r.href ?? "",
    })),
    faq: MOCK_FAQ.flatMap((g, gi) =>
      g.items.map((item, i) => ({ id: `faq-${gi}-${i}`, group: g.group, q: item.q, a: item.a, confirm: Boolean(item.confirm) })),
    ),
    saved: false,
  };
}

/** A stored doc (or none) over the defaults, field by field. */
export function mergeMemberResources(d: Partial<MemberResources> | undefined): MemberResources {
  const base = defaultMemberResources();
  if (!d) return base;
  return {
    slackInviteUrl: d.slackInviteUrl ?? base.slackInviteUrl,
    wifiNetwork: d.wifiNetwork ?? base.wifiNetwork,
    wifiPassword: d.wifiPassword ?? base.wifiPassword,
    hours: d.hours || base.hours,
    links: Array.isArray(d.links) ? d.links : base.links,
    faq: Array.isArray(d.faq) ? d.faq : base.faq,
    saved: true,
  };
}

export const memberResourcesRef = () => getAdminDb().collection(COLLECTIONS.settings).doc(MEMBER_RESOURCES_DOC);

/** Uncached — for the admin, which must see its own writes. */
export async function readMemberResources(): Promise<MemberResources> {
  const snap = await memberResourcesRef().get();
  return mergeMemberResources(snap.exists ? (snap.data() as Partial<MemberResources>) : undefined);
}

/*
  EXPIRES AFTER A MINUTE, not never. Every copy of the site (the live one,
  previews, local) reads ONE database but keeps ITS OWN cache, and a save
  clears only the cache of the copy it was made on — so Wi-Fi changed in
  one copy stayed old in the others forever. The page is members-only and
  rendered per request anyway, so a read a minute costs nothing.
*/
// ":v2" retires the entries cached before the expiry existed — Next keeps
// honoring an old entry's "never", so a new key is what clears every copy.
const cached = unstable_cache(readMemberResources, [dataKey("member-resources:v2")], { tags: [MEMBER_RESOURCES_TAG], revalidate: 60 });

/** The FAQ question that the Wi-Fi fields answer. Matched on its wording. */
export const isWifiQuestion = (q: string) => /wi-?fi/i.test(q);

/*
  THE FAQ AS MEMBERS READ IT. "What's the Wi-Fi?" is answered FROM THE
  WI-FI FIELDS once they're set — it was a separate hand-written answer, so
  updating the network and password left the FAQ saying "posted here once
  Geekdom provides them". One place to edit, never two that disagree.
*/
export function faqForMembers(res: MemberResources): FaqEntry[] {
  if (!res.wifiNetwork) return res.faq;
  const answer = `The network is ${res.wifiNetwork}${res.wifiPassword ? ` and the password is ${res.wifiPassword}` : ""}. It's also under “At a glance” on this page.`;
  return res.faq.map((f) => (isWifiQuestion(f.q) ? { ...f, a: answer, confirm: false } : f));
}

/** For the member portal: cached, and never throws. */
export async function getMemberResources(): Promise<MemberResources> {
  try {
    return await cached();
  } catch {
    return defaultMemberResources();
  }
}
