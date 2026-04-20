import { calculateImpactScore } from "@/lib/analysis/impact-score";
import type { AnalysisRunRequest } from "@/lib/analysis/types";
import { clusterFeedback, type ClusterFeedbackMessage, type WorkspaceContext } from "@/lib/ai/clustering";
import { createAdminClient } from "@/lib/supabase/admin";

type AnalysisRunRecord = {
  id: string;
  workspace_id: string;
  date_from: string;
  date_to: string;
  sources: string[] | null;
};

type WorkspaceRecord = {
  total_users: number | null;
  mrr_range: string | null;
};

type FeedbackItemRecord = {
  id: string;
  content: string;
  source_channel: string | null;
  occurred_at: string;
};

async function updateRun(
  analysisRunId: string,
  values: Record<string, string | number | null>,
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("analysis_runs").update(values).eq("id", analysisRunId);

  if (error) {
    throw new Error(error.message);
  }
}

async function loadAnalysisRun(analysisRunId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("analysis_runs")
    .select("id, workspace_id, date_from, date_to, sources")
    .eq("id", analysisRunId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Analysis run not found.");
  }

  return data as AnalysisRunRecord;
}

async function loadWorkspace(workspaceId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("total_users, mrr_range")
    .eq("id", workspaceId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Workspace not found.");
  }

  return data as WorkspaceRecord;
}

async function loadFeedback(run: AnalysisRunRecord) {
  const supabase = createAdminClient();
  const query = supabase
    .from("feedback_items")
    .select("id, content, source_channel, occurred_at")
    .eq("workspace_id", run.workspace_id)
    .gte("occurred_at", run.date_from)
    .lte("occurred_at", run.date_to)
    .order("occurred_at", { ascending: false });

  const sources = run.sources ?? [];
  const { data, error } = sources.length > 0 ? await query.in("source", sources) : await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as FeedbackItemRecord[];
}

function toClusterMessages(feedbackItems: FeedbackItemRecord[]): ClusterFeedbackMessage[] {
  return feedbackItems.map((item) => ({
    id: item.id,
    content: item.content,
    channel: item.source_channel,
    occurredAt: item.occurred_at,
  }));
}

export async function processAnalysis(analysisRunId: string) {
  const startedAt = Date.now();
  const supabase = createAdminClient();

  try {
    await updateRun(analysisRunId, {
      status: "processing",
      error_message: null,
    });

    const run = await loadAnalysisRun(analysisRunId);
    const [workspace, feedbackItems] = await Promise.all([
      loadWorkspace(run.workspace_id),
      loadFeedback(run),
    ]);

    await updateRun(analysisRunId, {
      feedback_count: feedbackItems.length,
    });

    const workspaceContext: WorkspaceContext = {
      totalUsers: workspace.total_users ?? 0,
      mrrRange: workspace.mrr_range,
      dateFrom: run.date_from,
      dateTo: run.date_to,
    };

    const clusteringResult = await clusterFeedback(toClusterMessages(feedbackItems), workspaceContext);
    const clustersToInsert = clusteringResult.clusters.map((cluster) => {
      const impact = calculateImpactScore(cluster, workspaceContext);

      return {
        analysis_run_id: run.id,
        workspace_id: run.workspace_id,
        title: cluster.title,
        description: cluster.description,
        frequency: cluster.frequency,
        impact_score: impact.impactScore,
        affected_users_estimate: impact.affectedUsers,
        revenue_at_risk: impact.revenueAtRisk,
        evidence_quotes: cluster.evidence_quotes,
        category: cluster.category,
        priority: cluster.priority,
        priority_reasoning: cluster.priority_reasoning,
      };
    });

    if (clustersToInsert.length > 0) {
      const { error: clusterError } = await supabase.from("clusters").insert(clustersToInsert);

      if (clusterError) {
        throw new Error(clusterError.message);
      }
    }

    await updateRun(analysisRunId, {
      status: "complete",
      feedback_count: feedbackItems.length,
      processing_time_ms: Date.now() - startedAt,
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Analysis processing failed.";

    try {
      await updateRun(analysisRunId, {
        status: "failed",
        error_message: errorMessage,
        processing_time_ms: Date.now() - startedAt,
        completed_at: new Date().toISOString(),
      });
    } catch (updateError) {
      console.error("Failed to mark analysis run as failed.", {
        analysisRunId,
        message: updateError instanceof Error ? updateError.message : "Unknown update error.",
      });
    }

    console.error("Analysis processing failed.", {
      analysisRunId,
      message: errorMessage,
    });
  }
}

export async function processAnalysisRun({
  analysisRunId,
}: {
  analysisRunId: string;
  request?: AnalysisRunRequest;
  workspaceId?: string;
}) {
  await processAnalysis(analysisRunId);
}
