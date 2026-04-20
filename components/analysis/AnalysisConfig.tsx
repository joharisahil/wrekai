"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";

import type { AnalysisIntegration, AnalysisSourceType } from "@/lib/analysis/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

const timeRanges = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30", recommended: true },
  { label: "Last 90 days", value: "90" },
  { label: "Custom range", value: "custom" },
] as const;

function formatLastSynced(date: string | null) {
  if (!date) {
    return "Never synced";
  }

  return `Last synced ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date))}`;
}

function calculateRange(range: string, customFrom: string, customTo: string) {
  if (range === "custom") {
    return {
      dateFrom: customFrom,
      dateTo: customTo,
      days: "custom",
    };
  }

  const days = Number(range);
  const dateTo = new Date();
  const dateFrom = new Date(dateTo.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    days: range,
  };
}

export function AnalysisConfig({ integrations }: { integrations: AnalysisIntegration[] }) {
  const router = useRouter();
  const [range, setRange] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedSources, setSelectedSources] = useState<AnalysisSourceType[]>(
    integrations.map((integration) => integration.type),
  );
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasIntegrations = integrations.length > 0;
  const selectedDays = range === "custom" ? "custom range" : `${range} days`;

  function toggleSource(source: AnalysisSourceType) {
    setSelectedSources((current) =>
      current.includes(source) ? current.filter((item) => item !== source) : [...current, source],
    );
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const computedRange = calculateRange(range, customFrom, customTo);

      if (range === "custom" && (!customFrom || !customTo)) {
        throw new Error("Select both custom date fields before running analysis.");
      }

      if (selectedSources.length === 0) {
        throw new Error("Select at least one connected feedback source.");
      }

      const response = await fetch("/api/analysis/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateFrom: computedRange.dateFrom,
          dateTo: computedRange.dateTo,
          sources: selectedSources,
          focus: focus.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { analysisRunId?: string; error?: string };

      if (!response.ok || !payload.analysisRunId) {
        throw new Error(payload.error ?? "Unable to start analysis.");
      }

      router.push(`/dashboard/analysis/${payload.analysisRunId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to start analysis.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasIntegrations) {
    return (
      <Alert>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Connect Slack first to run an analysis.</span>
          <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
            <Link href="/dashboard/integrations">Connect Slack</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Time Range
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {timeRanges.map((item) => (
            <button
              key={item.value}
              type="button"
              className={cn(
                "rounded-xl border p-4 text-left transition-colors",
                range === item.value
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              )}
              onClick={() => setRange(item.value)}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item.label}</span>
                {item.recommended ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Recommended
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
        {range === "custom" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            <Input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Sources
        </h2>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <label
              key={integration.id}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedSources.includes(integration.type)}
                  onChange={() => toggleSource(integration.type)}
                  className="size-4"
                />
                <div>
                  <p className="font-medium text-slate-950">
                    {integration.label} — {integration.detail}
                  </p>
                  <p className="text-sm text-slate-500">
                    {integration.type === "slack"
                      ? `${integration.selectedChannelCount ?? 0} channels selected`
                      : formatLastSynced(integration.lastSyncedAt)}
                  </p>
                </div>
              </div>
              {selectedSources.includes(integration.type) ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : null}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Focus
        </h2>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-3 size-5 text-slate-400" />
          <Input
            className="pl-10"
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="e.g., onboarding experience, export feature"
          />
        </div>
      </section>

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <Button
        type="button"
        className="h-12 w-full bg-slate-950 text-white hover:bg-slate-800"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Starting analysis..." : `Analyze ${selectedDays} of feedback →`}
      </Button>
    </div>
  );
}
