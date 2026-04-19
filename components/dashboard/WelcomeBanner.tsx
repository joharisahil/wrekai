"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "clareeva-dashboard-welcome-dismissed";

function subscribe(onStoreChange: () => void) {
  const onStorage = () => {
    onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot() {
  return false;
}

function getClientSnapshot() {
  return window.localStorage.getItem(DISMISS_KEY) !== "true";
}

export function WelcomeBanner({ firstName }: { firstName: string }) {
  const isVisible = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_KEY, "true");
    window.dispatchEvent(new Event("storage"));
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_55%,_#eef2ff_100%)] p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Welcome to Clareeva, {firstName}!
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Run your first analysis to see what your customers are really saying.
          </p>
          <Button asChild className="mt-2 bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/dashboard/analysis/new">Run First Analysis</Link>
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          aria-label="Dismiss welcome banner"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
