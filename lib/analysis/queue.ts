import { processAnalysisRun } from "@/lib/analysis/processor";
import type { AnalysisRunRequest } from "@/lib/analysis/types";

type AnalysisJob = {
  analysisRunId: string;
  request: AnalysisRunRequest;
  workspaceId: string;
};

async function enqueueUpstashJob(job: AnalysisJob) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return false;
  }

  const response = await fetch(`${redisUrl}/lpush/clareeva:analysis-jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(JSON.stringify(job)),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Unable to enqueue analysis job in Upstash. Status ${response.status}.`);
  }

  return true;
}

export async function enqueueAnalysisJob(job: AnalysisJob) {
  try {
    await enqueueUpstashJob(job);
  } catch (error) {
    console.error("Upstash enqueue failed. Falling back to local processing.", {
      analysisRunId: job.analysisRunId,
      message: error instanceof Error ? error.message : "Unknown queue error.",
    });
  }

  setTimeout(() => {
    void processAnalysisRun(job);
  }, 0);
}
