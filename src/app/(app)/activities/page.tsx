import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { ClientOfferFilter } from "@/components/client-offer-filter";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { getActivityTypeLabel } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { TableExportBar } from "@/components/export-xlsx-button";
import type { Account } from "@/lib/types";
import Link from "next/link";

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
      "*, account:accounts(id, name), deal:deals(id, title), creator:profiles!activities_created_by_fkey(full_name)"
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
      supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
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

  const filterHint = [selectedClient?.name, selectedOffer?.title]
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
        <div>
          <TableExportBar
            filename="activities"
            columns={[
              "Type",
              "Subject",
              "Body",
              "Client",
              "Offer",
              "Logged by",
              "When",
            ]}
            rows={activities.map((activity) => ({
              Type: getActivityTypeLabel(activity.type),
              Subject: activity.subject,
              Body: activity.body || "",
              Client: (activity.account as { name: string }).name,
              Offer: activity.deal
                ? (activity.deal as { title: string }).title
                : "",
              "Logged by":
                (activity.creator as { full_name: string } | null)?.full_name ||
                "",
              When: formatDateTime(activity.occurred_at),
            }))}
          />
          <div className="rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Logged by</th>
                <th className="px-4 py-3 text-left text-sm font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Badge variant="outline">
                      {getActivityTypeLabel(activity.type)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/activities/${activity.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {activity.subject}
                    </Link>
                    {activity.body && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                        {activity.body}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/accounts/${(activity.account as { id: string }).id}`}
                      className="text-primary hover:underline"
                    >
                      {(activity.account as { name: string }).name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {activity.deal ? (
                      <Link
                        href={`/deals/${(activity.deal as { id: string }).id}`}
                        className="text-primary hover:underline"
                      >
                        {(activity.deal as { title: string }).title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(activity.creator as { full_name: string } | null)?.full_name ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTime(activity.occurred_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
