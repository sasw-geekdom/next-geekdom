import type { Metadata } from "next";
import { requireMember } from "@/lib/auth/session";
import { PortalShell } from "@/components/portal/portal-shell";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s · Geekdom" },
  robots: { index: false, follow: false },
};

/*
  THE MEMBER PORTAL, and the admin behind its Admin switch.

  Outside the (site) group on purpose: no public navbar, footer or Lenis
  glide — this is a working surface, not a page to scroll through.

  The gate for the whole tree. proxy.ts only checks that a cookie exists;
  this verifies it and resolves the role on every request. It is not the ONLY
  gate — a layout doesn't re-run on client navigation, and server actions
  never run one — so pages and actions check again (lib/auth/session.ts).
*/
export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const user = await requireMember();
  return <PortalShell user={user}>{children}</PortalShell>;
}
