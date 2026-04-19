import { NextResponse } from "next/server";

import { fetchSlackChannels, getCurrentWorkspaceId, getSlackIntegration } from "@/lib/integrations/slack";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
    const integration = await getSlackIntegration(supabase, workspaceId);

    if (!integration) {
      return NextResponse.json({ error: "Slack is not connected." }, { status: 404 });
    }

    const token = integration.credentials.bot_token ?? integration.credentials.access_token;

    if (!token) {
      return NextResponse.json({ error: "Slack token is missing." }, { status: 400 });
    }

    const channels = await fetchSlackChannels(token);

    return NextResponse.json({
      channels,
      selectedChannels: integration.config.selected_channels ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to load Slack channels.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as { selectedChannels?: unknown };
    const selectedChannels = Array.isArray(payload.selectedChannels)
      ? payload.selectedChannels.filter((value): value is string => typeof value === "string")
      : [];

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
    const integration = await getSlackIntegration(supabase, workspaceId);

    if (!integration) {
      return NextResponse.json({ error: "Slack is not connected." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        config: {
          ...integration.config,
          selected_channels: selectedChannels,
        },
      })
      .eq("id", integration.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save Slack channels.",
      },
      { status: 500 },
    );
  }
}
