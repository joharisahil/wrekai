export type AnalysisSourceType = "slack" | "csv_upload";

export type AnalysisIntegration = {
  id: string;
  type: AnalysisSourceType;
  label: string;
  detail: string;
  lastSyncedAt: string | null;
  selectedChannelCount?: number;
};

export type AnalysisRunRequest = {
  dateFrom: string;
  dateTo: string;
  sources: AnalysisSourceType[];
  focus?: string;
};

export type AnalysisProgressStep = {
  id: string;
  name: string;
  detail: string;
  status: "pending" | "running" | "done" | "failed";
};
