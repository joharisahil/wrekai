"use client";

import { useState } from "react";

import { DashboardProvider, type DashboardUser, type DashboardWorkspace } from "@/components/dashboard/dashboard-context";
import { Header } from "@/components/dashboard/Header";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Sidebar } from "@/components/dashboard/Sidebar";

export function DashboardShell({
  children,
  user,
  workspace,
}: {
  children: React.ReactNode;
  user: DashboardUser;
  workspace: DashboardWorkspace;
}) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <DashboardProvider value={{ workspace, user }}>
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <Sidebar className="fixed inset-y-0 left-0 hidden md:flex" />

          <div className="flex min-h-screen flex-1 flex-col md:pl-60">
            <Header onOpenMobileNav={() => setIsMobileNavOpen(true)} />
            <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">{children}</main>
          </div>
        </div>

        <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      </div>
    </DashboardProvider>
  );
}
