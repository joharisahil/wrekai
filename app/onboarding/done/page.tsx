import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";

function getFirstName(fullName: string | null | undefined, email: string | undefined) {
  const trimmedName = fullName?.trim();

  if (trimmedName) {
    return trimmedName.split(/\s+/)[0];
  }

  if (email) {
    return email.split("@")[0];
  }

  return "there";
}

function SuccessCheckmark() {
  return (
    <div className="flex justify-center">
      <div className="flex size-20 animate-bounce items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5 9.5 17 19 7.5" />
        </svg>
      </div>
    </div>
  );
}

export default async function OnboardingDonePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  let profileErrorMessage: string | null = null;

  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true })
      .eq("id", user.id);

    if (profileError) {
      profileErrorMessage = profileError.message;
    }
  } catch (error) {
    profileErrorMessage =
      error instanceof Error ? error.message : "Unable to complete onboarding.";
  }

  const firstName = getFirstName(user.user_metadata.full_name, user.email);

  return (
    <div className="w-full max-w-4xl space-y-6">
      <OnboardingProgress currentStep={4} />

      <Card className="mx-auto w-full max-w-3xl rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-8 p-8 sm:p-10">
          <SuccessCheckmark />

          <div className="space-y-3 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              You&apos;re all set, {firstName}!
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              Clareeva is ready to analyze your feedback. Your first analysis usually
              surfaces 3-5 insights you didn&apos;t know existed.
            </p>
          </div>

          {profileErrorMessage ? <Alert variant="destructive">{profileErrorMessage}</Alert> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/dashboard/analysis/new"
              className={cn(
                buttonClassName({ className: "h-auto w-full justify-start rounded-2xl px-6 py-5" }),
                "flex-col items-start gap-2 bg-slate-950 text-white hover:bg-slate-800",
              )}
            >
              <span className="text-base font-semibold">Run Your First Analysis</span>
              <span className="text-sm font-normal text-slate-200">
                Jump straight into your first feedback scan and surface high-impact issues.
              </span>
            </Link>

            <Link
              href="/dashboard"
              className={cn(
                buttonClassName({
                  variant: "outline",
                  className: "h-auto w-full justify-start rounded-2xl px-6 py-5",
                }),
                "flex-col items-start gap-2",
              )}
            >
              <span className="text-base font-semibold">Explore Dashboard First</span>
              <span className="text-sm font-normal text-slate-500">
                Take a look around your workspace before kicking off the first analysis.
              </span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
