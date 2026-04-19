import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    redirect(`/login?error=${encodeURIComponent(profileError.message)}`);
  }

  if (profile?.onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mx-auto text-2xl font-semibold tracking-tight text-slate-950">
          Clareeva
        </Link>
        <div className="flex flex-1 items-center justify-center py-8">{children}</div>
      </div>
    </div>
  );
}
