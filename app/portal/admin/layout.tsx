import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { DATABASE_ID, ON_PREVIEW_DATA } from "@/lib/firebase/admin";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
};

export default async function AdminLayout({ children }: LayoutProps<"/portal/admin">) {
  // Staff only. A signed-in member who lands here is sent to the portal home.
  // The shell comes from the portal layout above; route handlers and server
  // actions re-check on their own, because neither runs a layout.
  await requireAdmin();
  return (
    <>
      <DataBanner />
      {children}
    </>
  );
}

/*
  WHICH DATABASE THIS ADMIN EDITS — said on every admin page of any copy
  that isn't the live site, because every deployment used to share one
  database and "it's just a preview" was untrue. Two cases:
    · a preview with its own database (FIREBASE_DATABASE_ID): changes stay here;
    · any other non-production copy (a preview without one, local dev):
      changes ARE live.
  Nothing on the production deployment.
*/
function DataBanner() {
  if (process.env.VERCEL_ENV === "production") return null;
  return (
    <div role="note" className="border-b border-dashed border-border bg-bone-light px-6 py-2.5 text-sm text-graphite lg:px-10">
      <span className={cn(MONO.micro, "mr-2 border border-border px-1.5 py-0.5")}>
        {ON_PREVIEW_DATA ? "Preview data" : "Live data"}
      </span>
      {ON_PREVIEW_DATA
        ? `Changes here stay in this preview's own database (“${DATABASE_ID}”) and never reach the live site.`
        : "This copy edits the live site's database — anything you publish or change here is live."}
    </div>
  );
}
