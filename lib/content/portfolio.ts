import "server-only";

import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type PortfolioDoc } from "@/lib/firebase/collections";
import { PORTFOLIO, type PortfolioCompany } from "@/lib/site";

/*
  "BUILT AT GEEKDOM", read from the `portfolio` collection the admin edits.

  Same shape as lib/content/events.ts: cached under a tag that admin saves
  expire, and falling back to the static PORTFOLIO in lib/site.ts when the
  collection is empty or Firestore can't be reached, so a build without
  credentials still renders the wall.

  The public type stays `PortfolioCompany` — PortfolioWall, /studio and
  /llms.txt don't need to know where the list came from.
*/

export const PORTFOLIO_TAG = "portfolio";

/** A company as the admin sees it: the public fields plus id and visibility. */
export interface AdminCompany extends PortfolioCompany {
  id: string;
  studio: boolean;
  hidden: boolean;
  order?: number;
}

/** Doc id for a company: a slug of its name, so a re-seed can't duplicate. */
export function companyId(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .slice(0, 80);
}

function toAdminCompany(id: string, d: PortfolioDoc): AdminCompany {
  return {
    id,
    name: d.name,
    href: d.href,
    link: d.link,
    stage: d.stage,
    founded: d.founded,
    studio: d.studio,
    description: d.description,
    logo: d.logo,
    logoHeight: d.logoHeight,
    logoMark: d.logoMark,
    hidden: d.hidden,
    order: d.order,
  };
}

/** Drop the admin-only fields — and `undefined`s, which don't serialize. */
function toPublic(c: AdminCompany): PortfolioCompany {
  const { id: _id, hidden: _hidden, order: _order, ...rest } = c;
  void _id;
  void _hidden;
  void _order;
  return Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== undefined),
  ) as unknown as PortfolioCompany;
}

/**
 * Wall order: the admin's dragged `order` first; anything without one (a
 * record written before ordering existed) after, oldest first.
 */
function byWallOrder(a: AdminCompany, b: AdminCompany): number {
  const ao = a.order ?? Number.POSITIVE_INFINITY;
  const bo = b.order ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao - bo;
  return a.founded - b.founded || a.name.localeCompare(b.name);
}

/** Every company, hidden ones included, in wall order. Uncached — the admin's view. */
export async function listPortfolio(): Promise<AdminCompany[]> {
  const snap = await getAdminDb().collection(COLLECTIONS.portfolio).get();
  return snap.docs
    .map((doc) => toAdminCompany(doc.id, doc.data() as PortfolioDoc))
    .sort(byWallOrder);
}

const readPortfolio = unstable_cache(
  async (): Promise<{ seeded: boolean; companies: PortfolioCompany[] }> => {
    const all = await listPortfolio();
    return {
      seeded: all.length > 0,
      companies: all.filter((c) => !c.hidden).map(toPublic),
    };
  },
  ["portfolio:public"],
  { tags: [PORTFOLIO_TAG] },
);

/** The wall's companies, in the admin's order, hidden ones left out. */
export async function getPortfolio(): Promise<readonly PortfolioCompany[]> {
  try {
    const result = await readPortfolio();
    return result.seeded ? result.companies : PORTFOLIO;
  } catch {
    return PORTFOLIO;
  }
}

/** PORTFOLIO as Firestore docs — "Copy from the current site". */
export function seedPortfolio(): { id: string; doc: Omit<PortfolioDoc, "updatedAt"> }[] {
  // PORTFOLIO is already oldest first; `order` records that as the start.
  return PORTFOLIO.map((c, i) => ({
    id: companyId(c.name),
    doc: Object.fromEntries(
      Object.entries({ ...c, studio: c.studio ?? false, hidden: false, order: i }).filter(
        ([, v]) => v !== undefined,
      ),
    ) as Omit<PortfolioDoc, "updatedAt">,
  }));
}
