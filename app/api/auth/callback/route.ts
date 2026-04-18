import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function buildRedirectUrl(request: NextRequest, path: string, message?: string) {
  const url = new URL(path, request.url);

  if (message) {
    url.searchParams.set("message", message);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (errorDescription) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "Missing authentication code. Please try again.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(buildRedirectUrl(request, next));
  } catch (error) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Unable to complete authentication.",
    );
    return NextResponse.redirect(loginUrl);
  }
}
