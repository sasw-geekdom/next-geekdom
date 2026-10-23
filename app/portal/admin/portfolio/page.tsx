import { listPortfolio } from "@/lib/content/portfolio";
import { PortfolioManager } from "@/components/admin/portfolio-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";

export const metadata = { title: "Built at Geekdom" };

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
        eyebrow="Site content"
        title="Built at Geekdom"
        description="The companies on the homepage wall. Studio-backed ones also appear on /studio."
      />
      <AdminSection>
        <PortfolioManager companies={companies} startAdding={add === "1"} />
      </AdminSection>
    </>
  );
}
