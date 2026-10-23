import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
};

export default async function AdminLayout({ children }: LayoutProps<"/portal/admin">) {
  // Staff only. A signed-in member who lands here is sent to the portal home.
  // The shell comes from the portal layout above; route handlers and server
  // actions re-check on their own, because neither runs a layout.
  await requireAdmin();
  return children;
}
