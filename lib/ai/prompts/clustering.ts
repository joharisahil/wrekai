import type { ClusterFeedbackMessage, WorkspaceContext } from "@/lib/ai/clustering";

export const CLUSTERING_SYSTEM_PROMPT = `You are a product intelligence analyst specializing in 
customer feedback synthesis for B2B SaaS companies.
Your job: analyze feedback messages and identify actionable 
patterns product teams can act on immediately.

CRITICAL RULES:
1. NEVER invent or estimate numbers. Only count what exists.
2. Only report themes with 3+ supporting messages.
3. Always use exact verbatim quotes from messages.
4. If confidence is low, say so explicitly.
5. Focus on actionable issues only.
6. Respond ONLY in valid JSON. No markdown. No preamble.`;

export function buildClusteringPrompt({
  dateFrom,
  dateTo,
  messages,
  mrrRange,
  totalUsers,
}: WorkspaceContext & {
  messages: ClusterFeedbackMessage[];
}) {
  const indexedMessages = messages
    .map(
      (message, index) =>
        `${index + 1}. [${message.occurredAt}] #${message.channel ?? "unknown"}: ${message.content}`,
    )
    .join("\n");

  return `Company context:
- Total active users: ${totalUsers}
- Monthly revenue / MRR: ${mrrRange ?? "unknown"}
- Date range: ${dateFrom} to ${dateTo}
- Messages provided: ${messages.length}

Feedback messages:
${indexedMessages}

Instructions:
- Find 3-7 actionable product themes.
- Only include a cluster when at least 3 supporting messages exist.
- Frequency must be the exact count of supporting messages.
- Percentage must be frequency divided by total messages analyzed, multiplied by 100.
- Evidence quotes must be exact verbatim quotes from the messages above.
- Use the message index from the numbered list.
- If there are fewer than 3 actionable themes, return fewer clusters.

Return this exact JSON schema:
{
  "clusters": [{
    "title": "string (5-8 words)",
    "description": "string (2-3 sentences)",
    "frequency": number,
    "percentage": number,
    "evidence_quotes": [{
      "quote": "exact verbatim quote",
      "message_index": number,
      "channel": "string",
      "occurred_at": "string"
    }],
    "category": "bug|feature_request|ux_issue|performance|other",
    "priority": "critical|high|medium|low",
    "priority_reasoning": "string"
  }],
  "metadata": {
    "total_analyzed": number,
    "total_clustered": number,
    "confidence": "high|medium|low",
    "confidence_note": "string"
  }
}`;
}
