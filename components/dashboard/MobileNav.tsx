"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Layers, Plug, Settings, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Sidebar, UserAvatar } from "@/components/dashboard/Sidebar";
import { useDashboardContext } from "@/components/dashboard/dashboard-context";

const mobileItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analysis", label: "Analysis", icon: Sparkles },
  { href: "/dashboard/clusters", label: "Clusters", icon: Layers },
  { href: "/dashboard/integrations", label: "Connect", icon: Plug },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function MobileNav({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user } = useDashboardContext();

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/30 md:hidden" onClick={onClose} />
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user.avatarUrl} initials={user.initials} className="size-9" />
              <div>
                <p className="text-sm font-medium text-slate-950">{user.fullName ?? "Clareeva user"}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close navigation">
              <X className="size-5" />
            </Button>
          </div>
          <Sidebar className="h-full w-full border-r-0" />
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white px-2 py-2 md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                  isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100",
                )}
                onClick={onClose}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
