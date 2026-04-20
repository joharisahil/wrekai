import type { ClusterFeedbackCluster, WorkspaceContext } from "@/lib/ai/clustering";

const priorityScores: Record<ClusterFeedbackCluster["priority"], number> = {
  critical: 10,
  high: 7.5,
  medium: 5,
  low: 2.5,
};

function monthlyRevenueEstimate(mrrRange: string | null) {
  switch (mrrRange) {
    case "$0 to $10k":
    case "0-10k":
      return 5000;
    case "$10k to $50k":
    case "10k-50k":
      return 30000;
    case "$50k to $200k":
    case "50k-200k":
      return 125000;
    case "$200k+":
    case "200k+":
      return 250000;
    default:
      return 0;
  }
}

export function calculateImpactScore(
  cluster: ClusterFeedbackCluster,
  workspaceContext: Pick<WorkspaceContext, "totalUsers" | "mrrRange">,
) {
  const frequencyScore = Math.min(cluster.frequency / 10, 10);
  const percentageScore = Math.min(cluster.percentage * 2, 10);
  const priorityScore = priorityScores[cluster.priority];
  const impactScore =
    frequencyScore * 0.4 + percentageScore * 0.3 + priorityScore * 0.3;
  const affectedUsers = Math.round(workspaceContext.totalUsers * (cluster.percentage / 100));
  const revenueAtRisk = monthlyRevenueEstimate(workspaceContext.mrrRange) * (cluster.percentage / 100);

  return {
    impactScore: Number(impactScore.toFixed(2)),
    affectedUsers,
    revenueAtRisk: Number(revenueAtRisk.toFixed(2)),
  };
}
