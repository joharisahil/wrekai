import { Buffer } from "node:buffer";

import { NextRequest, NextResponse } from "next/server";

import { getCurrentWorkspaceId, resolveSafeNextPath } from "@/lib/integrations/slack";
import { createClient } from "@/lib/supabase/server";

type SlackOAuthResponse = {
  ok: boolean;
  error?: string;
  access_token?: string;
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    access_token?: string;
  };
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const oauthError = request.nextUrl.searchParams.get("error");
  const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get("state"), "/onboarding/done");
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/onboarding/connect?error=${encodeURIComponent(oauthError)}`, appUrl()),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/onboarding/connect?error=Missing%20Slack%20authorization%20code.", appUrl()),
    );
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(
      new URL("/onboarding/connect?error=Slack%20environment%20variables%20are%20missing.", appUrl()),
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL("/login?message=Sign%20in%20to%20complete%20the%20Slack%20connection.", appUrl()),
      );
    }

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.redirect(
        new URL(
          `/onboarding/connect?error=${encodeURIComponent(
            `Slack token exchange failed with status ${response.status}.`,
          )}`,
          appUrl(),
        ),
      );
    }

    let payload: SlackOAuthResponse;

    try {
      payload = (await response.json()) as SlackOAuthResponse;
    } catch {
      return NextResponse.redirect(
        new URL("/onboarding/connect?error=Unable%20to%20parse%20Slack%20response.", appUrl()),
      );
    }

    if (!payload.ok || !payload.access_token || !payload.team?.id || !payload.team.name) {
      return NextResponse.redirect(
        new URL(
          `/onboarding/connect?error=${encodeURIComponent(
            payload.error ?? "Slack did not return a valid installation payload.",
          )}`,
          appUrl(),
        ),
      );
    }

    const { error: integrationError } = await supabase.from("integrations").insert({
      workspace_id: workspaceId,
      type: "slack",
      credentials: {
        access_token: payload.authed_user?.access_token ?? payload.access_token,
        team_id: payload.team.id,
        team_name: payload.team.name,
        bot_token: payload.access_token,
      },
      status: "active",
      config: {},
    });

    if (integrationError) {
      return NextResponse.redirect(
        new URL(`/onboarding/connect?error=${encodeURIComponent(integrationError.message)}`, appUrl()),
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected Slack callback error.";
    return NextResponse.redirect(
      new URL(
        `${nextPath.startsWith("/dashboard") ? nextPath : "/onboarding/connect"}?error=${encodeURIComponent(message)}`,
        appUrl(),
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, appUrl()));
}
