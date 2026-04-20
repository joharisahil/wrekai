import { buildTicketPrompt, TICKET_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts/ticket";

type TicketGenerationInput = {
  title: string;
  description: string | null;
  priority: string | null;
  frequency: number;
  evidenceQuotes: Array<{ quote: string; channel?: string; occurred_at?: string }>;
};

type GeneratedTicket = {
  title: string;
  description: string;
  impact_statement: string;
  acceptance_criteria: string[];
};

function getAnthropicApiKey() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  return apiKey;
}

export async function generateTicketFromCluster(cluster: TicketGenerationInput): Promise<GeneratedTicket> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getAnthropicApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.2,
      system: TICKET_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildTicketPrompt({ cluster }),
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
    throw new Error(payload.error?.message ?? `Claude ticket request failed with status ${response.status}.`);
  }

  const text = payload.content?.find((item) => item.type === "text")?.text;

  if (!text) {
    throw new Error("Claude did not return ticket content.");
  }

  try {
    return JSON.parse(text) as GeneratedTicket;
  } catch {
    throw new Error("Unable to parse generated ticket JSON.");
  }
}
