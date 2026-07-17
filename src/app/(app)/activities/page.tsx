import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getActivityTypeLabel } from "@/lib/types";
import Link from "next/link";

export default async function ActivitiesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: activities }, { data: accounts }] = await Promise.all([
    supabase
      .from("activities")
      .select("*, account:accounts(id, name), deal:deals(id, title), creator:profiles!activities_created_by_fkey(full_name)")
      .eq("org_id", profile.org_id)
      .order("occurred_at", { ascending: false })
      .limit(50),
    supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground">Calls, emails, meetings, and notes with clients</p>
        </div>
        <LogActivityDialog accounts={accounts || []} />
      </div>

      {!activities?.length ? (
        <EmptyState
          title="No activities logged"
          description="Start logging your interactions with clients."
        />
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getActivityTypeLabel(activity.type)}</Badge>
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    {activity.body && (
                      <p className="mt-2 text-sm text-muted-foreground">{activity.body}</p>
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
                      )}
                      {" "}
                      &middot;{" "}
                      {(activity.creator as { full_name: string } | null)?.full_name}
                      {" "}
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
