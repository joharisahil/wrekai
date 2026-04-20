import { NextRequest, NextResponse } from "next/server";

import { resolveSafeNextPath } from "@/lib/integrations/slack";

const slackScopes = [
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "users:read",
];

function appUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return url;
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;
    const nextPath = resolveSafeNextPath(request.nextUrl.searchParams.get("next"), "/dashboard");

    if (!clientId || !redirectUri) {
      return NextResponse.redirect(
        new URL(
          "/onboarding/connect?error=Missing%20Slack%20OAuth%20environment%20variables.",
          appUrl(),
        ),
      );
    }

    const authUrl = new URL("https://slack.com/oauth/v2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", slackScopes.join(","));
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", nextPath);

    return Response.redirect(authUrl.toString());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start the Slack OAuth flow.";
    return NextResponse.redirect(
      new URL(`/onboarding/connect?error=${encodeURIComponent(message)}`, appUrl()),
    );
  }
}
