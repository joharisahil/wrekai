import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { WorkspaceForm } from "@/components/onboarding/workspace-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingWorkspacePage() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <OnboardingProgress currentStep={1} />
      <Card className="mx-auto w-full max-w-md rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-3 p-8 pb-0">
          <CardTitle className="text-2xl text-slate-950">Set up your workspace</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Give your team a shared home for feedback analysis, clustering, and ticket generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <WorkspaceForm />
        </CardContent>
      </Card>
    </div>
  );
}
