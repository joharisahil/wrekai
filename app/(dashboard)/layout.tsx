import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  async function handleSignOut() {
    "use server";

    const serverClient = await createClient();
    const { error: signOutError } = await serverClient.auth.signOut();

    if (signOutError) {
      redirect(`/login?error=${encodeURIComponent(signOutError.message)}`);
    }

    redirect("/login?message=Signed out successfully.");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-teal-700">Clareeva workspace</p>
            <h1 className="text-lg font-semibold text-slate-950">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user.user_metadata.full_name ?? user.email}
              </p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <form action={handleSignOut}>
              <Button type="submit" variant="outline">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
