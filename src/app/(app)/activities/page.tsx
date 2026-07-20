import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { ClientOfferFilter } from "@/components/client-offer-filter";
import { EmptyState } from "@/components/empty-state";
import { getAccountDisplayName } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import type { Account } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ client?: string; offer?: string }>;
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const params = await searchParams;
  const clientId = params.client && params.client !== "all" ? params.client : null;
  const offerId = params.offer && params.offer !== "all" ? params.offer : null;
  const supabase = await createClient();

  let activitiesQuery = supabase
    .from("activities")
    .select(
      "*, account:accounts(id, name, nickname), deal:deals(id, title), event:events(id, name), creator:profiles!activities_created_by_fkey(full_name)"
    )
    .eq("org_id", profile.org_id)
    .order("occurred_at", { ascending: false })
    .limit(100);

  if (clientId) {
    activitiesQuery = activitiesQuery.eq("account_id", clientId);
  }
  if (clientId && offerId) {
    activitiesQuery = activitiesQuery.eq("deal_id", offerId);
  }

  const [{ data: activities }, { data: accounts }, { data: offers }] =
    await Promise.all([
      activitiesQuery,
      supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("nickname"),
      supabase
        .from("deals")
        .select("id, title, account_id")
        .eq("org_id", profile.org_id)
        .order("title"),
    ]);

  const selectedClient = clientId
    ? (accounts || []).find((a) => a.id === clientId)
    : null;
  const selectedOffer =
    clientId && offerId
      ? (offers || []).find((o) => o.id === offerId && o.account_id === clientId)
      : null;

  const filterHint = [
    selectedClient ? getAccountDisplayName(selectedClient) : null,
    selectedOffer?.title,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description={`Calls, emails, meetings, and notes with clients${filterHint ? ` · ${filterHint}` : ""}`}
      >
        <LogActivityDialog
          accounts={(accounts || []) as Account[]}
          defaultAccountId={clientId || undefined}
          defaultDealId={selectedOffer?.id}
        />
      </PageHeader>

      <Suspense fallback={null}>
        <ClientOfferFilter
          accounts={(accounts || []) as Account[]}
          offers={offers || []}
          basePath="/activities"
        />
      </Suspense>

      {!activities?.length ? (
        <EmptyState
          title={
            selectedOffer
              ? "No activities for this offer"
              : clientId
                ? "No activities for this client"
                : "No activities logged"
          }
          description={
            clientId
              ? "Try another filter or log a new activity."
              : "Start logging your interactions with clients."
          }
        />
      ) : (
        <ActivitiesTable activities={activities} />
      )}
    </div>
  );
}
