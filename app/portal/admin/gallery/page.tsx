import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { getGalleryManifest } from "@/lib/gallery";
import { buttonClass } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { FOUNDED_YEAR } from "@/lib/site";

export const metadata = { title: "Photo wall" };

/**
 * The archive behind /since-2011.
 *
 * `force-dynamic` for the same reason the public page is: the manifest changes
 * when someone syncs, and a staff page showing a cached count of a thing they
 * just changed is worse than useless.
 *
 * It reads the MANIFEST rather than the Storage bucket. The bucket is the
 * source of truth for what exists; the manifest is the source of truth for
 * what the wall is actually serving, and the gap between the two is precisely
 * what the sync button closes. Showing the bucket count here would report
 * success before any thumbnail had been built.
 */
export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const manifest = await getGalleryManifest();
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <>
      <PageHeader
        title="Photo wall"
        description={`The ${years}-years archive behind /since-2011 — the throwback page hiding in the site footer.`}
      />

      <AdminSection>
        <GalleryManager
          count={manifest.length}
          thumbs={manifest.map(({ name, url }) => ({ name, url }))}
        />

        <a
          href="/since-2011"
          target="_blank"
          rel="noreferrer noopener"
          className={buttonClass("outline", "sm", "mt-6 gap-2")}
        >
          View the wall
          <ExternalLink className="h-4 w-4" strokeWidth={2} />
        </a>
      </AdminSection>
    </>
  );
}
