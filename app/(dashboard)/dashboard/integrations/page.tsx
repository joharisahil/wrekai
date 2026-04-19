import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileUp,
  MessageSquareDashed,
  SquareArrowOutUpRight,
} from "lucide-react";

import { SlackChannelSelector } from "@/components/integrations/SlackChannelSelector";
import { IntegrationCard } from "@/components/integrations/IntegrationCard";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { uploadFeedbackFileAction } from "@/lib/onboarding/actions";

function SlackLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7">
      <path fill="#E01E5A" d="M10.6 3.2a2.4 2.4 0 1 0-4.8 0v2.4h4.8V3.2Z" />
      <path fill="#36C5F0" d="M20.8 10.6a2.4 2.4 0 1 0 0-4.8h-2.4v4.8h2.4Z" />
      <path fill="#2EB67D" d="M13.4 20.8a2.4 2.4 0 1 0 4.8 0v-2.4h-4.8v2.4Z" />
      <path fill="#ECB22E" d="M3.2 13.4a2.4 2.4 0 1 0 0 4.8h2.4v-4.8H3.2Z" />
      <path fill="#E01E5A" d="M5.8 10.6a2.4 2.4 0 1 1 0-4.8h6v4.8h-6Z" />
      <path fill="#36C5F0" d="M13.4 5.8a2.4 2.4 0 1 1 4.8 0v6h-4.8v-6Z" />
      <path fill="#2EB67D" d="M18.2 13.4a2.4 2.4 0 1 1 0 4.8h-6v-4.8h6Z" />
      <path fill="#ECB22E" d="M10.6 18.2a2.4 2.4 0 1 1-4.8 0v-6h4.8v6Z" />
    </svg>
  );
}

function formatRelativeSync(date: string | null) {
  if (!date) {
    return "Never synced";
  }

  const diffMs = Date.now() - new Date(date).getTime();
  const hours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

  if (hours < 24) {
    return `Last synced ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(hours / 24);
  return `Last synced ${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; disconnected?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.workspace_id) {
    redirect(`/login?error=${encodeURIComponent(membershipError?.message ?? "No workspace found.")}`);
  }

  const workspaceId = membership.workspace_id;

  const { data: integrations, error: integrationsError } = await supabase
    .from("integrations")
    .select("id, type, credentials, config, status, last_synced_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (integrationsError) {
    throw new Error(integrationsError.message);
  }

  const slackIntegration = integrations?.find((item) => item.type === "slack") ?? null;
  const jiraIntegration = integrations?.find((item) => item.type === "jira") ?? null;
  const csvIntegration = integrations?.find((item) => item.type === "csv_upload") ?? null;

  const slackCredentials =
    (slackIntegration?.credentials as
      | {
          team_name?: string;
        }
      | null) ?? null;
  const jiraConfig =
    (jiraIntegration?.config as
      | {
          project_name?: string;
          project_key?: string;
        }
      | null) ?? null;
  const csvConfig =
    (csvIntegration?.config as
      | {
          file_name?: string;
        }
      | null) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Integrations</h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect your feedback sources to Clareeva
        </p>
      </div>

      {params.error ? <Alert variant="destructive">{params.error}</Alert> : null}
      {params.disconnected === "slack" ? <Alert>Slack disconnected successfully.</Alert> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <IntegrationCard
          logo={<SlackLogo />}
          name="Slack"
          status={slackIntegration ? "Connected" : "Not connected"}
          statusTone={slackIntegration ? "success" : "neutral"}
          subtitle={
            slackIntegration
              ? `Connected to: ${slackCredentials?.team_name ?? "Slack workspace"}`
              : undefined
          }
          description={
            slackIntegration
              ? formatRelativeSync(slackIntegration.last_synced_at)
              : "Import feedback from your Slack channels automatically"
          }
          action={
            slackIntegration ? (
              <SlackChannelSelector />
            ) : (
              <Button asChild className="bg-slate-950 text-white hover:bg-slate-800">
                <Link href="/api/slack/connect?next=/dashboard/integrations">Connect Slack</Link>
              </Button>
            )
          }
          footer={
            slackIntegration ? (
              <form action="/api/slack/disconnect" method="post">
                <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-700">
                  Disconnect
                </button>
              </form>
            ) : null
          }
        />

        <IntegrationCard
          logo={<SquareArrowOutUpRight className="size-7 text-[#0052CC]" />}
          name="Jira"
          status={jiraIntegration ? "Connected" : "Not connected"}
          statusTone={jiraIntegration ? "success" : "neutral"}
          subtitle={
            jiraIntegration
              ? `Connected project: ${jiraConfig?.project_name ?? jiraConfig?.project_key ?? "Jira project"}`
              : undefined
          }
          description={
            jiraIntegration
              ? "Push generated tickets directly into your product backlog."
              : "Push generated tickets directly to your Jira backlog"
          }
          action={
            <Button type="button" variant={jiraIntegration ? "outline" : "default"} disabled>
              {jiraIntegration ? "Change Project" : "Connect Jira"}
            </Button>
          }
        />

        <IntegrationCard
          logo={<MessageSquareDashed className="size-7 text-[#5865F2]" />}
          name="Discord"
          status="Coming Soon"
          statusTone="comingSoon"
          description="Import feedback from Discord community channels"
          action={
            <Button type="button" variant="outline" disabled>
              Coming Soon
            </Button>
          }
        />

        <IntegrationCard
          logo={<FileUp className="size-7 text-slate-700" />}
          name="CSV Upload"
          status="Available"
          statusTone="neutral"
          subtitle={csvConfig?.file_name ? `Latest upload: ${csvConfig.file_name}` : undefined}
          description="Manually upload Slack exports or feedback CSV files"
        >
          <form action={uploadFeedbackFileAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value="/dashboard/integrations" />
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-slate-400">
              <FileUp className="size-8 text-slate-400" />
              <span className="mt-3 text-sm font-medium text-slate-900">
                Drag and drop a CSV or JSON file here
              </span>
              <span className="mt-1 text-xs text-slate-500">
                or click to choose a file from your computer
              </span>
              <Input
                name="feedbackFile"
                type="file"
                accept=".csv,.json"
                className="sr-only"
              />
            </label>
            <Button type="submit" className="w-full bg-slate-950 text-white hover:bg-slate-800">
              Upload File
            </Button>
          </form>
        </IntegrationCard>
      </div>
    </div>
  );
}
