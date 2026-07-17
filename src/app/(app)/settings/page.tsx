import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { SettingsClient } from "@/components/settings/settings-client";
import { PageHeader } from "@/components/page-header";

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
      <PageHeader
        title="Settings"
        description="Manage your organization and team"
      />
      <SettingsClient org={org} profiles={profiles || []} />
    </div>
  );
}
