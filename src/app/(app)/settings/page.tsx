import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ data: org }, { data: profiles }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", profile.org_id).single(),
    supabase.from("profiles").select("*").eq("org_id", profile.org_id).order("full_name"),
  ]);

  if (!org) return <p>Organization not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your organization and team</p>
      </div>
      <SettingsClient org={org} profiles={profiles || []} />
    </div>
  );
}
