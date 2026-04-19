import type { SupabaseClient } from "@supabase/supabase-js";

type TypedSupabaseClient = SupabaseClient;

export type SlackIntegrationRecord = {
  id: string;
  workspaceId: string;
  credentials: {
    access_token?: string;
    team_id?: string;
    team_name?: string;
    bot_token?: string;
  };
  config: {
    selected_channels?: string[];
    project_name?: string;
    file_name?: string;
  };
  status: string;
  lastSyncedAt: string | null;
};

export type SlackChannel = {
  id: string;
  name: string;
  memberCount: number;
};

export function resolveSafeNextPath(input: string | null | undefined, fallback: string) {
  if (!input || !input.startsWith("/")) {
    return fallback;
  }

  if (input.startsWith("//")) {
    return fallback;
  }

  return input;
}

export async function getCurrentWorkspaceId(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.workspace_id) {
    throw new Error("No workspace found for this account.");
  }

  return data.workspace_id;
}

export async function getSlackIntegration(
  supabase: TypedSupabaseClient,
  workspaceId: string,
): Promise<SlackIntegrationRecord | null> {
  const { data, error } = await supabase
    .from("integrations")
    .select("id, workspace_id, credentials, config, status, last_synced_at")
    .eq("workspace_id", workspaceId)
    .eq("type", "slack")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    credentials: (data.credentials as SlackIntegrationRecord["credentials"]) ?? {},
    config: (data.config as SlackIntegrationRecord["config"]) ?? {},
    status: data.status,
    lastSyncedAt: data.last_synced_at,
  };
}

type SlackConversationsListResponse = {
  ok: boolean;
  error?: string;
  channels?: Array<{
    id: string;
    name: string;
    num_members?: number;
  }>;
};

export async function fetchSlackChannels(token: string): Promise<SlackChannel[]> {
  const response = await fetch("https://slack.com/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=200", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Slack channels request failed with status ${response.status}.`);
  }

  let payload: SlackConversationsListResponse;

  try {
    payload = (await response.json()) as SlackConversationsListResponse;
  } catch {
    throw new Error("Unable to parse Slack channels response.");
  }

  if (!payload.ok) {
    throw new Error(payload.error ?? "Slack returned an invalid channels response.");
  }

  return (payload.channels ?? []).map((channel) => ({
    id: channel.id,
    name: channel.name,
    memberCount: channel.num_members ?? 0,
  }));
}
