"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, RotateCcw, XCircle } from "lucide-react";

import type { AnalysisProgressStep } from "@/lib/analysis/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type StatusResponse = {
  status: "pending" | "processing" | "complete" | "failed";
  errorMessage?: string | null;
  steps: AnalysisProgressStep[];
};

function StepIcon({ status }: { status: AnalysisProgressStep["status"] }) {
  if (status === "done") {
    return <CheckCircle2 className="size-5 text-emerald-600" />;
  }

  if (status === "running") {
    return <Loader2 className="size-5 animate-spin text-slate-950" />;
  }

  if (status === "failed") {
    return <XCircle className="size-5 text-red-600" />;
  }

  return <Circle className="size-5 text-slate-300" />;
}

export function AnalysisProgress({ analysisRunId }: { analysisRunId: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function pollStatus() {
      try {
        const response = await fetch(`/api/analysis/${analysisRunId}/status`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as StatusResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load analysis status.");
        }

        if (!active) {
          return;
        }

        setStatus(payload);

        if (payload.status === "complete") {
          router.replace(`/dashboard/analysis/${analysisRunId}?view=results`);
        }

        if (payload.status === "failed") {
          setError(payload.errorMessage ?? "Analysis failed. Please try again.");
        }
      } catch (pollError) {
        if (active) {
          setError(pollError instanceof Error ? pollError.message : "Unable to load analysis status.");
        }
      }
    }

    void pollStatus();
    const interval = window.setInterval(() => {
      void pollStatus();
    }, 2000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [analysisRunId, router]);

  const steps = status?.steps ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <StepIcon status={step.status} />
            <div>
              <p
                className={cn(
                  "font-medium",
                  step.status === "pending" ? "text-slate-500" : "text-slate-950",
                )}
              >
                {step.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <Alert variant="destructive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              <RotateCcw className="mr-2 size-4" />
              Retry
            </Button>
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
