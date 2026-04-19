import { NextResponse } from "next/server";

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

export async function GET() {
  try {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;

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

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start the Slack OAuth flow.";
    return NextResponse.redirect(
      new URL(`/onboarding/connect?error=${encodeURIComponent(message)}`, appUrl()),
    );
  }
}
