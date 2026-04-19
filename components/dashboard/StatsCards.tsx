import { Clock3, Layers, MessageSquare, Ticket } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/dashboard/queries";

function formatLastAnalysis(date: string | null) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function StatsCards({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      title: "Total Feedback Items",
      value: stats.totalFeedbackItems.toLocaleString("en-US"),
      subtext: "messages analyzed",
      icon: MessageSquare,
    },
    {
      title: "Active Clusters",
      value: stats.activeClusters.toLocaleString("en-US"),
      subtext: "recurring themes found",
      icon: Layers,
    },
    {
      title: "Tickets Generated",
      value: stats.ticketsGenerated.toLocaleString("en-US"),
      subtext: "ready for your backlog",
      icon: Ticket,
    },
    {
      title: "Last Analysis",
      value: formatLastAnalysis(stats.lastAnalysisAt),
      subtext: stats.lastAnalysisAt ? "last run" : "Never",
      icon: Clock3,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.title} className="rounded-xl border-slate-100 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-500">{item.title}</p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                  <p className="text-sm text-slate-500">{item.subtext}</p>
                </div>
                <div className="rounded-xl bg-slate-100 p-3 text-slate-500">
                  <Icon className="size-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
