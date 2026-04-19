"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

import { UserAvatar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { useDashboardContext } from "@/components/dashboard/dashboard-context";

const titleMap: Array<{ match: (pathname: string) => boolean; title: string }> = [
  { match: (pathname) => pathname === "/dashboard", title: "Dashboard" },
  { match: (pathname) => pathname.startsWith("/dashboard/analysis"), title: "Analysis" },
  { match: (pathname) => pathname.startsWith("/dashboard/clusters"), title: "Clusters" },
  { match: (pathname) => pathname.startsWith("/dashboard/tickets"), title: "Tickets" },
  { match: (pathname) => pathname.startsWith("/dashboard/integrations"), title: "Integrations" },
  { match: (pathname) => pathname.startsWith("/dashboard/settings"), title: "Settings" },
];

function getPageTitle(pathname: string) {
  return titleMap.find((item) => item.match(pathname))?.title ?? "Dashboard";
}

export function Header({
  onOpenMobileNav,
}: {
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const { user } = useDashboardContext();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
        <h1 className="text-lg font-semibold text-slate-950">{getPageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button asChild className="h-9 bg-slate-950 px-3 text-white hover:bg-slate-800">
          <Link href="/dashboard/analysis/new">Run Analysis</Link>
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-5 text-slate-600" />
        </Button>
        <UserAvatar avatarUrl={user.avatarUrl} initials={user.initials} className="size-9" />
      </div>
    </header>
  );
}
