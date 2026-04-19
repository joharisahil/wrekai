import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function IntegrationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Manage Slack, CSV uploads, and future product feedback sources here.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        This page is ready for integration status, reconnect flows, and sync controls.
      </CardContent>
    </Card>
  );
}
