import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClustersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clusters</CardTitle>
        <CardDescription>
          Review clustered customer issues and inspect evidence-backed patterns here.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        This page is ready for the cluster list and detail drill-down experience.
      </CardContent>
    </Card>
  );
}
