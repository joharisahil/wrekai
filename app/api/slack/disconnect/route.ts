import { NextResponse } from "next/server";

import { getCurrentWorkspaceId } from "@/lib/integrations/slack";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
    }

    const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
    const { error } = await supabase
      .from("integrations")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("type", "slack");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/integrations?error=${encodeURIComponent(error.message)}`,
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        ),
      );
    }
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unable to disconnect Slack.",
        )}`,
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      ),
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/integrations?disconnected=slack", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  );
}
