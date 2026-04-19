import Link from "next/link";

import { CsvUploadForm } from "@/components/onboarding/csv-upload-form";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function SlackLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-10">
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

export default async function OnboardingConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="w-full max-w-3xl space-y-6">
      <OnboardingProgress currentStep={3} />

      <Card className="mx-auto w-full max-w-2xl rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-4 p-8 pb-0">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-slate-100 p-3">
              <SlackLogo />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-slate-950">Connect Slack</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Connect your Slack workspace so Clareeva can cluster product feedback and detect
                recurring issues automatically.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-8">
          {params.error ? <Alert variant="destructive">{params.error}</Alert> : null}

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-base font-semibold text-slate-950">Option A</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Install the Clareeva Slack app to let us ingest channel history from the workspace
                you choose.
              </p>
            </div>
            <Button asChild className="h-11 w-full bg-slate-950 text-white hover:bg-slate-800">
              <Link href="/api/slack/connect">Connect Slack Workspace</Link>
            </Button>
          </div>

          <Accordion>
            <AccordionItem>
              <AccordionTrigger>Why do you need access?</AccordionTrigger>
              <AccordionContent>
                WrekAi requests read-only channel and user scopes so it can ingest feedback,
                identify repeated product issues, and generate evidence-backed ticket suggestions.
                We process your data but never store raw messages.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-950">
              Don&apos;t want to connect Slack? Upload a CSV export instead
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload a CSV or JSON export to the `feedback-uploads` storage bucket so you can
              continue onboarding without a Slack OAuth install.
            </p>
            <div className="mt-4">
              <CsvUploadForm />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
