import { redirect } from "next/navigation";

import { AnalysisConfig } from "@/components/analysis/AnalysisConfig";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalysisIntegrations } from "@/lib/analysis/queries";
import { getCurrentWorkspaceId } from "@/lib/integrations/slack";
import { createClient } from "@/lib/supabase/server";

export default async function NewAnalysisPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const workspaceId = await getCurrentWorkspaceId(supabase, user.id);
  const integrations = await getAnalysisIntegrations(supabase, workspaceId);

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Run New Analysis</CardTitle>
          <CardDescription>
            Choose the feedback window, connected sources, and an optional focus area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalysisConfig integrations={integrations} />
        </CardContent>
      </Card>
    </div>
  );
}
