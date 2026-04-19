import { createHash } from "node:crypto";

import { generateEmbeddingsBatch } from "@/lib/ai/embeddings";
import { SlackApiError, getAllSelectedChannelMessages, type SlackMessage } from "@/lib/slack/client";
import { createAdminClient } from "@/lib/supabase/admin";

type IngestResult = {
  messagesIngested: number;
  messagesSkipped: number;
  embeddingsGenerated: number;
  processingTimeMs: number;
};

const EMBEDDING_UPDATE_CONCURRENCY = 20;
const DEDUPE_CHUNK_SIZE = 500;
const SLACK_LOOKBACK_DAYS = 30;

function cleanSlackMessage(text: string) {
  return text
    .replace(/<@[^>]+>/g, " ")
    .replace(/<#([^|>]+)\|([^>]+)>/g, "#$2")
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2")
    .replace(/<([^>]+)>/g, "$1")
    .replace(/:[a-zA-Z0-9_+-]+:/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function createContentHash(content: string) {
  return createHash("md5").update(content).digest("hex");
}

function isSystemOrBotMessage(message: SlackMessage) {
  return Boolean(message.botId) || message.subtype === "bot_message" || message.subtype === "channel_join" || message.subtype === "channel_leave" || message.subtype === "channel_topic" || message.subtype === "channel_purpose" || message.subtype === "file_share" || message.type === "message_changed";
}

function toOccurredAt(ts: string) {
  const parsed = Number.parseFloat(ts);

  if (Number.isNaN(parsed)) {
    throw new Error("Invalid Slack timestamp encountered during ingestion.");
  }

  return new Date(parsed * 1000).toISOString();
}

function formatVector(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

async function loadExistingHashes(contentHashes: string[]) {
  const supabase = createAdminClient();
  const existingHashes = new Set<string>();

  for (let index = 0; index < contentHashes.length; index += DEDUPE_CHUNK_SIZE) {
    const chunk = contentHashes.slice(index, index + DEDUPE_CHUNK_SIZE);
    const { data, error } = await supabase
      .from("feedback_items")
      .select("content_hash")
      .in("content_hash", chunk);

    if (error) {
      throw new Error(error.message);
    }

    for (const item of data ?? []) {
      if (item.content_hash) {
        existingHashes.add(item.content_hash);
      }
    }
  }

  return existingHashes;
}

async function updateIntegrationStatus(workspaceId: string, updates: Record<string, unknown>) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("integrations")
    .update(updates)
    .eq("workspace_id", workspaceId)
    .eq("type", "slack");

  if (error) {
    console.error("Failed to update Slack integration status.", {
      workspaceId,
      message: error.message,
    });
  }
}

async function updateEmbeddings(
  feedbackItems: Array<{ id: string; content: string }>,
): Promise<number> {
  if (feedbackItems.length === 0) {
    return 0;
  }

  const supabase = createAdminClient();
  const embeddings = await generateEmbeddingsBatch(feedbackItems.map((item) => item.content));
  let updatedCount = 0;

  for (let index = 0; index < feedbackItems.length; index += EMBEDDING_UPDATE_CONCURRENCY) {
    const chunk = feedbackItems.slice(index, index + EMBEDDING_UPDATE_CONCURRENCY);

    await Promise.all(
      chunk.map(async (item, offset) => {
        const embedding = embeddings[index + offset];

        if (!embedding) {
          return;
        }

        const { error } = await supabase
          .from("feedback_items")
          .update({
            embedding: formatVector(embedding),
          })
          .eq("id", item.id);

        if (error) {
          console.error("Failed to persist embedding for feedback item.", {
            feedbackItemId: item.id,
            message: error.message,
          });
          return;
        }

        updatedCount += 1;
      }),
    );
  }

  return updatedCount;
}

export async function ingestSlackMessages(workspaceId: string): Promise<IngestResult> {
  const startedAt = Date.now();
  const supabase = createAdminClient();
  const dateTo = new Date();
  const dateFrom = new Date(dateTo.getTime() - SLACK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  try {
    const { integrationId, messages } = await getAllSelectedChannelMessages(workspaceId, dateFrom, dateTo);

    const preparedMessages = messages
      .filter((message) => !isSystemOrBotMessage(message))
      .map((message) => {
        const cleanedContent = cleanSlackMessage(message.text);

        return {
          sourceId: message.ts,
          sourceChannel: message.channelName,
          content: cleanedContent,
          contentHash: createContentHash(cleanedContent),
          occurredAt: toOccurredAt(message.ts),
        };
      })
      .filter((message) => message.content.length >= 10);

    const existingHashes = await loadExistingHashes(preparedMessages.map((message) => message.contentHash));
    const newMessages = preparedMessages.filter((message) => !existingHashes.has(message.contentHash));

    if (newMessages.length === 0) {
      await updateIntegrationStatus(workspaceId, {
        status: "active",
        last_synced_at: new Date().toISOString(),
      });

      return {
        messagesIngested: 0,
        messagesSkipped: preparedMessages.length,
        embeddingsGenerated: 0,
        processingTimeMs: Date.now() - startedAt,
      };
    }

    const { data: insertedMessages, error: insertError } = await supabase
      .from("feedback_items")
      .insert(
        newMessages.map((message) => ({
          workspace_id: workspaceId,
          integration_id: integrationId,
          source: "slack",
          source_id: message.sourceId,
          source_channel: message.sourceChannel,
          content: message.content,
          content_hash: message.contentHash,
          occurred_at: message.occurredAt,
        })),
      )
      .select("id, content");

    if (insertError) {
      throw new Error(insertError.message);
    }

    let embeddingsGenerated = 0;

    try {
      embeddingsGenerated = await updateEmbeddings(insertedMessages ?? []);
    } catch (embeddingError) {
      console.error("OpenAI embedding generation failed for Slack ingestion.", {
        workspaceId,
        feedbackItemCount: insertedMessages?.length ?? 0,
        message: embeddingError instanceof Error ? embeddingError.message : "Unknown embeddings error",
      });
    }

    await updateIntegrationStatus(workspaceId, {
      status: "active",
      last_synced_at: new Date().toISOString(),
    });

    return {
      messagesIngested: insertedMessages?.length ?? 0,
      messagesSkipped: preparedMessages.length - (insertedMessages?.length ?? 0),
      embeddingsGenerated,
      processingTimeMs: Date.now() - startedAt,
    };
  } catch (error) {
    if (error instanceof SlackApiError && error.invalidToken) {
      await updateIntegrationStatus(workspaceId, {
        status: "error",
      });
    }

    console.error("Slack ingestion failed.", {
      workspaceId,
      message: error instanceof Error ? error.message : "Unknown Slack ingestion error",
      processingTimeMs: Date.now() - startedAt,
    });

    throw error;
  }
}
