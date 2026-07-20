import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { AccountsTable } from "@/components/accounts/accounts-table";
import { AccountFilters } from "@/components/accounts/account-filters";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    status?: string;
    owner?: string;
    vip?: string;
  }>;
}

export default async function AccountsPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("accounts")
    .select("*, owner:profiles!accounts_owner_id_fkey(full_name)")
    .eq("org_id", profile.org_id)
    .order("nickname");

  if (params.q) {
    const q = params.q.replace(/[%_,]/g, "");
    query = query.or(`nickname.ilike.%${q}%,name.ilike.%${q}%`);
  }
  if (params.type && params.type !== "all") query = query.eq("type", params.type);
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.owner && params.owner !== "all") query = query.eq("owner_id", params.owner);
  if (params.vip === "yes") query = query.eq("is_vip", true);

  const { data: accounts } = await query;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", profile.org_id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Companies and individual guests you manage"
      >
        <CreateAccountDialog profiles={profiles || []} />
      </PageHeader>

      <Suspense>
        <AccountFilters profiles={profiles || []} />
      </Suspense>

      {!accounts?.length ? (
        <EmptyState
          title="No clients yet"
          description="Add your first company or individual guest to start managing relationships."
        />
      ) : (
        <AccountsTable accounts={accounts} />
      )}
    </div>
  );
}
