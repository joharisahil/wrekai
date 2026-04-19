import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalysisPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis</CardTitle>
        <CardDescription>
          This area will host analysis runs, progress states, and saved reports.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Start a new analysis from the header or review recent runs here.
      </CardContent>
    </Card>
  );
}
