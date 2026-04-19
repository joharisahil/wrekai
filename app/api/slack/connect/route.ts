import { NextResponse } from "next/server";

import { resolveSafeNextPath } from "@/lib/integrations/slack";

const slackScopes = [
  "channels:read",
  "channels:history",
  "groups:read",
  "groups:history",
  "users:read",
];

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function GET(request: Request) {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;
    const requestUrl = new URL(request.url);
    const nextPath = resolveSafeNextPath(requestUrl.searchParams.get("next"), "/onboarding/done");

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

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start the Slack OAuth flow.";
    return NextResponse.redirect(
      new URL(`/onboarding/connect?error=${encodeURIComponent(message)}`, appUrl()),
    );
  }
}
