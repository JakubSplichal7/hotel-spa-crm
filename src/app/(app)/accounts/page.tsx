import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateAccountDialog } from "@/components/accounts/create-account-dialog";
import { AccountFilters } from "@/components/accounts/account-filters";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getAccountTypeLabel, getAcquisitionLabel } from "@/lib/types";
import Link from "next/link";

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
    .order("name");

  if (params.q) query = query.ilike("name", `%${params.q}%`);
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
        <div className="rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Acquisition</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {account.name}
                    </Link>
                    {account.is_vip && (
                      <Badge className="ml-2" variant="warning">
                        VIP
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{getAccountTypeLabel(account.type)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {[account.city, account.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        account.status === "active"
                          ? "success"
                          : account.status === "prospect"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {account.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getAcquisitionLabel(account.loyalty_tier)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(account.owner as { full_name: string } | null)?.full_name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
