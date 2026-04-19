"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  LogOut,
  Plug,
  Settings,
  Sparkles,
  Ticket,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/cn";
import { useDashboardContext } from "@/components/dashboard/dashboard-context";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/analysis", label: "Analysis", icon: Sparkles },
  { href: "/dashboard/clusters", label: "Clusters", icon: Layers },
  { href: "/dashboard/tickets", label: "Tickets", icon: Ticket },
  { href: "/dashboard/integrations", label: "Integrations", icon: Plug },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function getIsActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

function UserAvatar({
  avatarUrl,
  initials,
  className,
}: {
  avatarUrl: string | null;
  initials: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt="User avatar"
        className={cn("size-10 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white",
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { user, workspace } = useDashboardContext();

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login?message=Signed out successfully.");
      router.refresh();
    } catch {
      router.replace("/login?error=Unable to sign out right now.");
    }
  }

  return (
    <aside className={cn("flex h-full w-60 flex-col border-r border-slate-200 bg-white", className)}>
      <div className="border-b border-slate-200 px-6 py-6">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-950">
          Clareeva
        </Link>
        <p className="mt-2 text-sm text-slate-500">{workspace.name}</p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = getIsActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <Icon className="size-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <UserAvatar avatarUrl={user.avatarUrl} initials={user.initials} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-950">{user.fullName ?? workspace.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full justify-center"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

export { UserAvatar, navigationItems };
