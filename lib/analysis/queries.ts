import type { SupabaseClient } from "@supabase/supabase-js";

import type { AnalysisIntegration, AnalysisSourceType } from "@/lib/analysis/types";

type TypedSupabaseClient = SupabaseClient;

function formatIntegrationDetail(type: string, credentials: unknown, config: unknown) {
  const typedCredentials = credentials as { team_name?: string } | null;
  const typedConfig = config as { file_name?: string; selected_channels?: string[] } | null;

  if (type === "slack") {
    return typedCredentials?.team_name ?? "Slack workspace";
  }

  if (type === "csv_upload") {
    return typedConfig?.file_name ?? "Uploaded feedback file";
  }

  return "Connected source";
}

export async function getAnalysisIntegrations(
  supabase: TypedSupabaseClient,
  workspaceId: string,
): Promise<AnalysisIntegration[]> {
  const { data, error } = await supabase
    .from("integrations")
    .select("id, type, credentials, config, status, last_synced_at")
    .eq("workspace_id", workspaceId)
    .in("type", ["slack", "csv_upload"])
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((integration) => {
    const config = integration.config as { selected_channels?: string[] } | null;

    return {
      id: integration.id,
      type: integration.type as AnalysisSourceType,
      label: integration.type === "slack" ? "Slack" : "CSV Upload",
      detail: formatIntegrationDetail(integration.type, integration.credentials, integration.config),
      lastSyncedAt: integration.last_synced_at,
      selectedChannelCount: config?.selected_channels?.length,
    };
  });
}
