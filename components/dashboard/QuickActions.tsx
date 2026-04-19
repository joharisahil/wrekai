import Link from "next/link";
import { DatabaseZap, PlayCircle, Plug } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  {
    href: "/dashboard/integrations",
    title: "Connect Slack",
    description: "Pull customer conversations directly from your product feedback channels.",
    icon: Plug,
  },
  {
    href: "/dashboard/analysis/new",
    title: "Run Analysis",
    description: "Kick off your first clustering run and surface top issues fast.",
    icon: PlayCircle,
  },
  {
    href: "/dashboard/integrations",
    title: "Upload CSV",
    description: "Import a feedback export if you want to start without a live integration.",
    icon: DatabaseZap,
  },
];

export function QuickActions() {
  return (
    <Card className="rounded-xl border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          You haven&apos;t run an analysis yet. Start with one of these setup steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <div key={action.title} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
              <div className="rounded-xl bg-white p-3 text-slate-500 shadow-sm w-fit">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-950">{action.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
              <Button asChild className="mt-4 w-full bg-slate-950 text-white hover:bg-slate-800">
                <Link href={action.href}>Open</Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
