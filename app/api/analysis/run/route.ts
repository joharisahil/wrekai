import { NextResponse } from "next/server";
import { z } from "zod";

import { enqueueAnalysisJob } from "@/lib/analysis/queue";
import type { AnalysisRunRequest } from "@/lib/analysis/types";
import { getCurrentWorkspaceId } from "@/lib/integrations/slack";
import { createClient } from "@/lib/supabase/server";

const runAnalysisSchema = z
  .object({
    dateFrom: z.string().datetime(),
    dateTo: z.string().datetime(),
    sources: z.array(z.enum(["slack", "csv_upload"])).min(1),
    focus: z.string().trim().max(200).optional(),
  })
  .strict()
  .refine((value) => new Date(value.dateFrom) < new Date(value.dateTo), {
    message: "dateFrom must be before dateTo.",
    path: ["dateFrom"],
  });

export async function POST(request: Request) {
  try {
    const payload = runAnalysisSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid analysis request." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
    const requestBody: AnalysisRunRequest = payload.data;
    const { data: analysisRun, error: insertError } = await supabase
      .from("analysis_runs")
      .insert({
        workspace_id: workspaceId,
        created_by: user.id,
        date_from: requestBody.dateFrom,
        date_to: requestBody.dateTo,
        sources: requestBody.sources,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !analysisRun) {
      return NextResponse.json(
        { error: insertError?.message ?? "Unable to create analysis run." },
        { status: 500 },
      );
    }

    await enqueueAnalysisJob({
      analysisRunId: analysisRun.id,
      request: requestBody,
      workspaceId,
    });

    return NextResponse.json({ analysisRunId: analysisRun.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start analysis." },
      { status: 500 },
    );
  }
}
