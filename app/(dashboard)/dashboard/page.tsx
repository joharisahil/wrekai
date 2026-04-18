import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle>Authentication is live</CardTitle>
          <CardDescription>
            Your dashboard routes are protected by Supabase SSR middleware and server-side user
            checks.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-slate-600">
          <div className="rounded-xl bg-slate-50 p-4">
            Signed in as <span className="font-medium text-slate-950">{user?.email}</span>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            Next steps: add workspace onboarding, Slack integration, and analysis creation behind
            this protected layout.
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Auth features included</CardTitle>
          <CardDescription>Ready for Supabase Auth configuration in Vercel.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>Email/password signup with validation and success handling.</p>
          <p>Google OAuth signup redirecting through the Supabase callback exchange.</p>
          <p>Password login and passwordless magic-link sign in.</p>
          <p>Middleware redirect rules for `/dashboard`, `/login`, `/signup`, and auth callback.</p>
        </CardContent>
      </Card>
    </div>
  );
}
