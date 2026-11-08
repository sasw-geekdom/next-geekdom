import { listPortfolio } from "@/lib/content/portfolio";
import { PortfolioManager } from "@/components/admin/portfolio-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";

export const metadata = { title: "Portfolio" };

/**
 * "Built at Geekdom" — the portfolio wall on the homepage (and its Studio
 * subset on /studio), edited here. The `portfolio` collection; the static
 * PORTFOLIO in lib/site.ts renders until it has anything in it.
 */
export default async function AdminPortfolioPage(props: PageProps<"/portal/admin/portfolio">) {
  const { add } = await props.searchParams;
  const companies = await listPortfolio();

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Geekdom's companies — on the homepage under “Built at Geekdom”, and the Studio-backed ones on /studio under “Studio Companies”."
      />
      <AdminSection>
        <PortfolioManager companies={companies} startAdding={add === "1"} />
      </AdminSection>
    </>
  );
}
