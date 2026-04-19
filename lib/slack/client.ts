import { createAdminClient } from "@/lib/supabase/admin";
import { fetchSlackChannels, getSlackIntegration } from "@/lib/integrations/slack";

export type SlackMessage = {
  channelId: string;
  channelName: string;
  text: string;
  ts: string;
  user?: string;
  subtype?: string;
  botId?: string;
  type?: string;
};

type SlackHistoryResponse = {
  ok: boolean;
  error?: string;
  messages?: Array<{
    text?: string;
    ts?: string;
    user?: string;
    subtype?: string;
    bot_id?: string;
    type?: string;
  }>;
  response_metadata?: {
    next_cursor?: string;
  };
};

export class SlackApiError extends Error {
  readonly code?: string;
  readonly invalidToken: boolean;

  constructor(message: string, options?: { code?: string; invalidToken?: boolean }) {
    super(message);
    this.name = "SlackApiError";
    this.code = options?.code;
    this.invalidToken = options?.invalidToken ?? false;
  }
}

function getSlackErrorMessage(status: number) {
  return `Slack API request failed with status ${status}.`;
}

function isInvalidSlackTokenError(code: string | undefined) {
  return code === "invalid_auth" || code === "account_inactive" || code === "token_revoked";
}

async function fetchChannelHistoryPage({
  channelId,
  cursor,
  latest,
  oldest,
  token,
}: {
  channelId: string;
  cursor?: string;
  latest?: string;
  oldest?: string;
  token: string;
}) {
  const url = new URL("https://slack.com/api/conversations.history");
  url.searchParams.set("channel", channelId);
  url.searchParams.set("inclusive", "true");
  url.searchParams.set("limit", "200");

  if (oldest) {
    url.searchParams.set("oldest", oldest);
  }

  if (latest) {
    url.searchParams.set("latest", latest);
  }

  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new SlackApiError(getSlackErrorMessage(response.status));
  }

  let payload: SlackHistoryResponse;

  try {
    payload = (await response.json()) as SlackHistoryResponse;
  } catch {
    throw new SlackApiError("Unable to parse Slack history response.");
  }

  if (!payload.ok) {
    throw new SlackApiError(payload.error ?? "Slack returned an invalid history response.", {
      code: payload.error,
      invalidToken: isInvalidSlackTokenError(payload.error),
    });
  }

  return payload;
}

export async function getChannelMessages(
  token: string,
  channelId: string,
  oldest?: string,
  latest?: string,
): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;

  do {
    const payload = await fetchChannelHistoryPage({
      channelId,
      cursor,
      latest,
      oldest,
      token,
    });

    for (const message of payload.messages ?? []) {
      if (!message.ts || typeof message.text !== "string") {
        continue;
      }

      messages.push({
        channelId,
        channelName: channelId,
        text: message.text,
        ts: message.ts,
        user: message.user,
        subtype: message.subtype,
        botId: message.bot_id,
        type: message.type,
      });
    }

    cursor = payload.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return messages;
}

export async function getAllSelectedChannelMessages(
  workspaceId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<{
  integrationId: string;
  messages: SlackMessage[];
}> {
  const supabase = createAdminClient();
  const integration = await getSlackIntegration(supabase, workspaceId);

  if (!integration) {
    throw new Error("Slack integration is not connected for this workspace.");
  }

  const token = integration.credentials.bot_token ?? integration.credentials.access_token;

  if (!token) {
    throw new SlackApiError("Slack token is missing for this integration.", {
      invalidToken: true,
    });
  }

  const selectedChannels = integration.config.selected_channels ?? [];

  if (selectedChannels.length === 0) {
    return {
      integrationId: integration.id,
      messages: [],
    };
  }

  const channels = await fetchSlackChannels(token);
  const channelMap = new Map(channels.map((channel) => [channel.id, channel.name]));
  const oldest = `${Math.floor(dateFrom.getTime() / 1000)}`;
  const latest = `${Math.floor(dateTo.getTime() / 1000)}`;

  const results = await Promise.all(
    selectedChannels.map(async (channelId) => {
      const channelMessages = await getChannelMessages(token, channelId, oldest, latest);

      return channelMessages.map((message) => ({
        ...message,
        channelName: channelMap.get(channelId) ?? channelId,
      }));
    }),
  );

  return {
    integrationId: integration.id,
    messages: results.flat(),
  };
}
