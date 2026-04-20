export const TICKET_GENERATION_SYSTEM_PROMPT = `You are a senior product manager writing concise, evidence-backed Jira tickets.
Use only the supplied cluster data. Do not invent customer evidence, counts, or business impact.
Respond only in valid JSON.`;

export function buildTicketPrompt({
  cluster,
}: {
  cluster: {
    title: string;
    description: string | null;
    priority: string | null;
    frequency: number;
    evidenceQuotes: Array<{ quote: string; channel?: string; occurred_at?: string }>;
  };
}) {
  return `Create a Jira-ready product ticket for this customer feedback cluster.

Cluster:
- Title: ${cluster.title}
- Description: ${cluster.description ?? "No description provided"}
- Priority: ${cluster.priority ?? "unknown"}
- Frequency: ${cluster.frequency}
- Evidence:
${cluster.evidenceQuotes.map((quote, index) => `${index + 1}. "${quote.quote}"`).join("\n")}

Return JSON:
{
  "title": "string",
  "description": "string",
  "impact_statement": "string",
  "acceptance_criteria": "string[]"
}`;
}
