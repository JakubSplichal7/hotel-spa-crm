import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getActivityTypeLabel } from "@/lib/types";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ActivityDetailPage({ params }: PageProps) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select(
      "*, account:accounts(id, name), deal:deals(id, title), event:events(id, name), creator:profiles!activities_created_by_fkey(full_name)"
    )
    .eq("id", id)
    .single();

  if (!activity) notFound();

  const deal = activity.deal as { id: string; title: string } | null;
  const account = activity.account as { id: string; name: string } | null;
  const event = activity.event as { id: string; name: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={
            deal
              ? `/deals/${deal.id}`
              : event
                ? `/events/${event.id}`
                : "/activities"
          }
          className="text-sm text-muted-foreground hover:text-primary"
        >
          &larr; Back to{" "}
          {deal ? "offer" : event ? "event" : "activities"}
        </Link>
        <div className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{getActivityTypeLabel(activity.type)}</Badge>
            <h1 className="text-3xl font-bold">{activity.subject}</h1>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {account ? "Client" : event ? "Event" : "Client"}
            </p>
            {account ? (
              <Link
                href={`/accounts/${account.id}`}
                className="text-lg font-medium text-primary hover:underline"
              >
                {account.name}
              </Link>
            ) : event ? (
              <Link
                href={`/events/${event.id}`}
                className="text-lg font-medium text-primary hover:underline"
              >
                {event.name}
              </Link>
            ) : (
              <p className="text-lg font-medium">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offer</p>
            {deal ? (
              <Link
                href={`/deals/${deal.id}`}
                className="text-lg font-medium text-primary hover:underline"
              >
                {deal.title}
              </Link>
            ) : (
              <p className="text-lg font-medium">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">When</p>
            <p className="text-lg font-medium">
              {formatDateTime(activity.occurred_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {activity.body && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium">Details</p>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {activity.body}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-muted-foreground">
        Logged by{" "}
        {(activity.creator as { full_name: string } | null)?.full_name || "—"}
      </p>
    </div>
  );
}
