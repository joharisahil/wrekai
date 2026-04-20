import { redirect } from "next/navigation";

import { AnalysisProgress } from "@/components/analysis/AnalysisProgress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AnalysisRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: analysisRun, error } = await supabase
    .from("analysis_runs")
    .select("id, status, feedback_count, error_message")
    .eq("id", id)
    .maybeSingle();

  if (error || !analysisRun) {
    redirect("/dashboard/analysis");
  }

  if (query.view === "results" || analysisRun.status === "complete") {
    return (
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Analysis Complete</CardTitle>
          <CardDescription>
            {analysisRun.feedback_count ?? 0} feedback messages were analyzed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-slate-600">
          Results are ready. The cluster results view can now render saved clusters for this run.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Analysis in progress</CardTitle>
        <CardDescription>
          Clareeva is processing your feedback and preparing insight clusters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalysisProgress analysisRunId={id} />
      </CardContent>
    </Card>
  );
}
