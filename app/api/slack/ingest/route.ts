import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/integrations/slack";
import { ingestSlackMessages } from "@/lib/slack/ingest";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const startedAt = Date.now();

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: userError?.message ?? "Unauthorized",
        },
        { status: 401 },
      );
    }

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
    const result = await ingestSlackMessages(workspaceId);

    return NextResponse.json({
      success: true,
      messagesIngested: result.messagesIngested,
      messagesSkipped: result.messagesSkipped,
      embeddingsGenerated: result.embeddingsGenerated,
      processingTimeMs: result.processingTimeMs,
      progress: {
        status: "complete",
        startedAt,
        finishedAt: Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Slack ingestion failed.",
        processingTimeMs: Date.now() - startedAt,
        progress: {
          status: "failed",
        },
      },
      { status: 500 },
    );
  }
}
