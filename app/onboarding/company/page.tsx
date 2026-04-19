import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { CompanyForm } from "@/components/onboarding/company-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OnboardingCompanyPage() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <OnboardingProgress currentStep={2} />
      <Card className="mx-auto w-full max-w-md rounded-xl border-slate-200 bg-white shadow-sm">
        <CardHeader className="space-y-3 p-8 pb-0">
          <CardTitle className="text-2xl text-slate-950">Company details</CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Help Clareeva calibrate impact scoring with a few quick details about your company.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <CompanyForm />
        </CardContent>
      </Card>
    </div>
  );
}
