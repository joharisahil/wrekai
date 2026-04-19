import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewAnalysisPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>New analysis</CardTitle>
          <CardDescription>
            Your onboarding success screen now links here. This page is ready for the analysis
            builder flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-slate-600">
          Next, we can build the analysis setup form with source selection, date ranges, and
          background processing states.
        </CardContent>
      </Card>
    </div>
  );
}
