import { NextRequest, NextResponse } from "next/server";

import type { AnalysisProgressStep } from "@/lib/analysis/types";
import { getCurrentWorkspaceId } from "@/lib/integrations/slack";
import { createClient } from "@/lib/supabase/server";

function buildSteps(run: {
  status: string;
  feedback_count: number | null;
  error_message: string | null;
}): AnalysisProgressStep[] {
  const failed = run.status === "failed";
  const complete = run.status === "complete";
  const processing = run.status === "processing";

  return [
    {
      id: "fetching",
      name: "Fetching feedback messages",
      detail:
        run.feedback_count !== null
          ? `${run.feedback_count} messages found`
          : "Collecting feedback from selected sources...",
      status: run.feedback_count !== null || complete ? "done" : processing ? "running" : "pending",
    },
    {
      id: "clustering",
      name: "Clustering themes",
      detail: complete ? "Themes clustered" : "Analyzing patterns...",
      status: complete ? "done" : processing ? "running" : failed ? "failed" : "pending",
    },
    {
      id: "impact",
      name: "Calculating impact scores",
      detail: complete ? "Impact scores calculated" : "Waiting for clusters...",
      status: complete ? "done" : "pending",
    },
    {
      id: "tickets",
      name: "Generating tickets",
      detail: complete ? "Tickets can now be generated from clusters" : "Waiting for impact scores...",
      status: complete ? "done" : "pending",
    },
    {
      id: "complete",
      name: "Complete",
      detail: failed ? run.error_message ?? "Analysis failed" : "Analysis results are ready",
      status: failed ? "failed" : complete ? "done" : "pending",
    },
  ];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
    const { data: analysisRun, error } = await supabase
      .from("analysis_runs")
      .select("id, status, feedback_count, error_message")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error || !analysisRun) {
      return NextResponse.json(
        { error: error?.message ?? "Analysis run not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      status: analysisRun.status,
      errorMessage: analysisRun.error_message,
      feedbackCount: analysisRun.feedback_count,
      steps: buildSteps(analysisRun),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load analysis status." },
      { status: 500 },
    );
  }
}
