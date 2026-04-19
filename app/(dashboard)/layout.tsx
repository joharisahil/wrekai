import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

function getInitials(fullName: string | null | undefined, email: string) {
  const source = fullName?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    redirect(`/login?error=${encodeURIComponent(profileError.message)}`);
  }

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership?.workspace_id || !membership.workspaces) {
    redirect(`/login?error=${encodeURIComponent(membershipError?.message ?? "No workspace found.")}`);
  }

  const workspaceRecord = Array.isArray(membership.workspaces)
    ? membership.workspaces[0]
    : membership.workspaces;

  if (!workspaceRecord?.name || !workspaceRecord.slug) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      workspace={{
        id: membership.workspace_id,
        name: workspaceRecord.name,
        slug: workspaceRecord.slug,
      }}
      user={{
        fullName: profile.full_name ?? user.user_metadata.full_name ?? null,
        email: user.email ?? "",
        avatarUrl: profile.avatar_url,
        initials: getInitials(profile.full_name ?? user.user_metadata.full_name, user.email ?? "CU"),
      }}
    >
      {children}
    </DashboardShell>
  );
}
