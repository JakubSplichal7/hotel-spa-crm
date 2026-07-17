import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { ClientFilter } from "@/components/client-filter";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getActivityTypeLabel } from "@/lib/types";
import type { Account } from "@/lib/types";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const params = await searchParams;
  const clientId = params.client && params.client !== "all" ? params.client : null;
  const supabase = await createClient();

  let activitiesQuery = supabase
    .from("activities")
    .select(
      "*, account:accounts(id, name), deal:deals(id, title), creator:profiles!activities_created_by_fkey(full_name)"
    )
    .eq("org_id", profile.org_id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (clientId) {
    activitiesQuery = activitiesQuery.eq("account_id", clientId);
  }

  const [{ data: activities }, { data: accounts }] = await Promise.all([
    activitiesQuery,
    supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
  ]);

  const selectedClient = clientId
    ? (accounts || []).find((a) => a.id === clientId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground">
            Calls, emails, meetings, and notes with clients
            {selectedClient ? ` · ${selectedClient.name}` : ""}
          </p>
        </div>
        <LogActivityDialog
          accounts={(accounts || []) as Account[]}
          defaultAccountId={clientId || undefined}
        />
      </div>

      <Suspense fallback={null}>
        <ClientFilter accounts={(accounts || []) as Account[]} basePath="/activities" />
      </Suspense>

      {!activities?.length ? (
        <EmptyState
          title={clientId ? "No activities for this client" : "No activities logged"}
          description={
            clientId
              ? "Try another client or log a new activity."
              : "Start logging your interactions with clients."
          }
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getActivityTypeLabel(activity.type)}
                      </Badge>
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    {activity.body && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {activity.body}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      <Link
                        href={`/accounts/${(activity.account as { id: string }).id}`}
                        className="text-primary hover:underline"
                      >
                        {(activity.account as { name: string }).name}
                      </Link>
                      {activity.deal && (
                        <>
                          {" "}
                          &middot; Offer:{" "}
                          <Link
                            href={`/deals/${(activity.deal as { id: string }).id}`}
                            className="text-primary hover:underline"
                          >
                            {(activity.deal as { title: string }).title}
                          </Link>
                        </>
                      )}{" "}
                      &middot;{" "}
                      {(activity.creator as { full_name: string } | null)?.full_name}{" "}
                      &middot; {formatDateTime(activity.occurred_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
