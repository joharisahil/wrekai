import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Update workspace preferences, billing, and future team management controls.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">
        Workspace settings will live here as the product grows.
      </CardContent>
    </Card>
  );
}
