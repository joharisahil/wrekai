import type { SupabaseClient } from "@supabase/supabase-js";
type TypedSupabaseClient = SupabaseClient;

export type DashboardWorkspaceInfo = {
  id: string;
  name: string;
};

export type DashboardUserInfo = {
  firstName: string;
};

export type DashboardStats = {
  totalFeedbackItems: number;
  activeClusters: number;
  ticketsGenerated: number;
  lastAnalysisAt: string | null;
};

export type DashboardCluster = {
  id: string;
  title: string;
  priority: string | null;
  impactScore: number | null;
  frequency: number;
};

export type DashboardTicket = {
  id: string;
  title: string;
  createdAt: string;
  exportStatus: string;
};

function getFirstName(fullName: string | null | undefined, email: string | undefined) {
  const trimmedName = fullName?.trim();

  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  if (email) {
    return email.split("@")[0];
  }

  return "there";
}

export async function getDashboardWorkspaceInfo(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<DashboardWorkspaceInfo> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const workspace = Array.isArray(data?.workspaces) ? data.workspaces[0] : data?.workspaces;

  if (!data?.workspace_id || !workspace?.name) {
    throw new Error("No workspace found for this account.");
  }

  return {
    id: data.workspace_id,
    name: workspace.name,
  };
}

export async function getDashboardUserInfo(
  supabase: TypedSupabaseClient,
  userId: string,
  fallbackEmail: string | undefined,
  fallbackFullName: string | null | undefined,
): Promise<DashboardUserInfo> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    firstName: getFirstName(data?.full_name ?? fallbackFullName, fallbackEmail),
  };
}

async function getCount(
  query: PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
) {
  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getDashboardStats(
  supabase: TypedSupabaseClient,
  workspaceId: string,
): Promise<DashboardStats> {
  const [feedbackCount, clusterCount, ticketCount, lastAnalysis] = await Promise.all([
    getCount(
      supabase
        .from("feedback_items")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ),
    getCount(
      supabase
        .from("clusters")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ),
    getCount(
      supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ),
    supabase
      .from("analysis_runs")
      .select("created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (lastAnalysis.error) {
    throw new Error(lastAnalysis.error.message);
  }

  return {
    totalFeedbackItems: feedbackCount,
    activeClusters: clusterCount,
    ticketsGenerated: ticketCount,
    lastAnalysisAt: lastAnalysis.data?.created_at ?? null,
  };
}

export async function getRecentClusters(
  supabase: TypedSupabaseClient,
  workspaceId: string,
): Promise<DashboardCluster[]> {
  const { data: recentAnalysis, error: analysisError } = await supabase
    .from("analysis_runs")
    .select("id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (analysisError) {
    throw new Error(analysisError.message);
  }

  if (!recentAnalysis?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("clusters")
    .select("id, title, priority, impact_score, frequency")
    .eq("workspace_id", workspaceId)
    .eq("analysis_run_id", recentAnalysis.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((cluster) => ({
    id: cluster.id,
    title: cluster.title,
    priority: cluster.priority,
    impactScore: cluster.impact_score !== null ? Number(cluster.impact_score) : null,
    frequency: cluster.frequency,
  }));
}

export async function getRecentTickets(
  supabase: TypedSupabaseClient,
  workspaceId: string,
): Promise<DashboardTicket[]> {
  const { data, error } = await supabase
    .from("tickets")
    .select("id, title, created_at, export_format, exported_at, jira_ticket_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((ticket) => ({
    id: ticket.id,
    title: ticket.title,
    createdAt: ticket.created_at,
    exportStatus: ticket.exported_at
      ? `Exported${ticket.export_format ? ` to ${ticket.export_format.toUpperCase()}` : ""}`
      : ticket.jira_ticket_id
        ? "Linked to Jira"
        : "Draft",
  }));
}
