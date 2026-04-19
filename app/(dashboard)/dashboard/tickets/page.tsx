import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TicketsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tickets</CardTitle>
        <CardDescription>
          Track generated tickets, exports, and Jira push history from one place.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        This section is ready for generated ticket previews and export workflows.
      </CardContent>
    </Card>
  );
}
