import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { DashboardCluster } from "@/lib/dashboard/queries";

function priorityStyles(priority: string | null) {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700";
    case "high":
      return "bg-orange-100 text-orange-700";
    case "medium":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function priorityLabel(priority: string | null, impactScore: number | null) {
  if (priority) {
    return priority.replace("_", " ");
  }

  if (impactScore !== null) {
    return `Impact ${impactScore.toFixed(1)}`;
  }

  return "Low";
}

export function RecentClusters({ clusters }: { clusters: DashboardCluster[] }) {
  return (
    <Card className="rounded-xl border-slate-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Recent Clusters</CardTitle>
        <CardDescription>Latest themes surfaced from your most recent analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {clusters.map((cluster) => (
          <div
            key={cluster.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-2">
              <p className="font-medium text-slate-950">{cluster.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                    priorityStyles(cluster.priority),
                  )}
                >
                  {priorityLabel(cluster.priority, cluster.impactScore)}
                </span>
                <span>{cluster.frequency} mentions</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/dashboard/clusters?cluster=${cluster.id}`}>View</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
