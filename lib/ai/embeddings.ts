const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_BATCH_SIZE = 100;
const EMBEDDING_BATCH_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return apiKey;
}

type OpenAiEmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
    index?: number;
  }>;
  error?: {
    message?: string;
  };
};

async function requestEmbeddings(input: string[]) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getOpenAiApiKey()}`,
    },
    body: JSON.stringify({
      input,
      model: OPENAI_EMBEDDING_MODEL,
    }),
    cache: "no-store",
  });

  let payload: OpenAiEmbeddingResponse;

  try {
    payload = (await response.json()) as OpenAiEmbeddingResponse;
  } catch {
    throw new Error("Unable to parse OpenAI embeddings response.");
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI embeddings request failed with status ${response.status}.`);
  }

  const embeddings = (payload.data ?? [])
    .sort((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map((item) => item.embedding)
    .filter((item): item is number[] => Array.isArray(item));

  if (embeddings.length !== input.length) {
    throw new Error("OpenAI embeddings response did not match the requested input size.");
  }

  return embeddings;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const [embedding] = await requestEmbeddings([text]);
  return embedding;
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embeddings: number[][] = [];

  for (let index = 0; index < texts.length; index += EMBEDDING_BATCH_SIZE) {
    const chunk = texts.slice(index, index + EMBEDDING_BATCH_SIZE);
    const chunkEmbeddings = await requestEmbeddings(chunk);
    embeddings.push(...chunkEmbeddings);

    if (index + EMBEDDING_BATCH_SIZE < texts.length) {
      await sleep(EMBEDDING_BATCH_DELAY_MS);
    }
  }

  return embeddings;
}
