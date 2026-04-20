import { z } from "zod";

import { buildClusteringPrompt, CLUSTERING_SYSTEM_PROMPT } from "@/lib/ai/prompts/clustering";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";
const MAX_MESSAGES_FOR_CLUSTERING = 500;

export type ClusterFeedbackMessage = {
  id: string;
  content: string;
  channel: string | null;
  occurredAt: string;
};

export type WorkspaceContext = {
  totalUsers: number;
  mrrRange: string | null;
  dateFrom: string;
  dateTo: string;
};

const evidenceQuoteSchema = z.object({
  quote: z.string(),
  message_index: z.number(),
  channel: z.string(),
  occurred_at: z.string(),
});

const clusterSchema = z.object({
  title: z.string(),
  description: z.string(),
  frequency: z.number(),
  percentage: z.number(),
  evidence_quotes: z.array(evidenceQuoteSchema),
  category: z.enum(["bug", "feature_request", "ux_issue", "performance", "other"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  priority_reasoning: z.string(),
});

const clusteringResponseSchema = z.object({
  clusters: z.array(clusterSchema),
  metadata: z.object({
    total_analyzed: z.number(),
    total_clustered: z.number(),
    confidence: z.enum(["high", "medium", "low"]),
    confidence_note: z.string(),
  }),
});

export type ClusterFeedbackResult = z.infer<typeof clusteringResponseSchema>;
export type ClusterFeedbackCluster = z.infer<typeof clusterSchema>;

function getAnthropicApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  return apiKey;
}

function extractJson(text: string) {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Claude response did not contain a JSON object.");
  }

  return trimmed.slice(start, end + 1);
}

async function callClaude(prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getAnthropicApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 6000,
      temperature: 0.2,
      system: CLUSTERING_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Claude clustering request failed with status ${response.status}.`);
  }

  const text = payload.content?.find((item) => item.type === "text")?.text;

  if (!text) {
    throw new Error("Claude did not return text content.");
  }

  return text;
}

function parseClusteringJson(text: string) {
  try {
    return clusteringResponseSchema.parse(JSON.parse(extractJson(text)));
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Unable to parse clustering JSON: ${error.message}`
        : "Unable to parse clustering JSON.",
    );
  }
}

export async function clusterFeedback(
  messages: ClusterFeedbackMessage[],
  workspaceContext: WorkspaceContext,
): Promise<ClusterFeedbackResult> {
  const recentMessages = [...messages]
    .sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
    .slice(0, MAX_MESSAGES_FOR_CLUSTERING);

  const prompt = buildClusteringPrompt({
    ...workspaceContext,
    messages: recentMessages,
  });

  const firstResponse = await callClaude(prompt);

  try {
    return parseClusteringJson(firstResponse);
  } catch (firstError) {
    const retryResponse = await callClaude(
      `${prompt}

Your previous response could not be parsed as JSON. Return ONLY valid JSON matching the schema. Do not include markdown or commentary.`,
    );

    try {
      return parseClusteringJson(retryResponse);
    } catch (secondError) {
      throw new Error(
        `Claude clustering returned invalid JSON after retry. First error: ${
          firstError instanceof Error ? firstError.message : "unknown"
        }. Second error: ${secondError instanceof Error ? secondError.message : "unknown"}.`,
      );
    }
  }
}
