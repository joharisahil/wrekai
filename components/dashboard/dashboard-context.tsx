"use client";

import { createContext, useContext } from "react";

export type DashboardWorkspace = {
  id: string;
  name: string;
  slug: string;
};

export type DashboardUser = {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  initials: string;
};

type DashboardContextValue = {
  workspace: DashboardWorkspace;
  user: DashboardUser;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DashboardContextValue;
}) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardProvider.");
  }

  return context;
}
