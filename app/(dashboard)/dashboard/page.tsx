import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecentClusters } from "@/components/dashboard/RecentClusters";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import {
  getDashboardStats,
  getDashboardUserInfo,
  getDashboardWorkspaceInfo,
  getRecentClusters,
  getRecentTickets,
} from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/server";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error(userError?.message ?? "User session is missing.");
  }

  const workspace = await getDashboardWorkspaceInfo(supabase, user.id);
  const [viewer, stats, recentClusters, recentTickets] = await Promise.all([
    getDashboardUserInfo(supabase, user.id, user.email, user.user_metadata.full_name),
    getDashboardStats(supabase, workspace.id),
    getRecentClusters(supabase, workspace.id),
    getRecentTickets(supabase, workspace.id),
  ]);

  return (
    <div className="space-y-6">
      <WelcomeBanner firstName={viewer.firstName} />

      <StatsCards stats={stats} />

      {stats.lastAnalysisAt ? <RecentClusters clusters={recentClusters} /> : <QuickActions />}

      <Card className="rounded-xl border-slate-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recent Tickets</CardTitle>
          <CardDescription>Most recently generated tickets from your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentTickets.length > 0 ? (
            recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-950">{ticket.title}</p>
                  <p className="text-sm text-slate-500">Created {formatDate(ticket.createdAt)}</p>
                </div>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {ticket.exportStatus}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              No tickets generated yet. Your first analysis will surface the strongest themes and
              help you draft backlog-ready tickets.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
