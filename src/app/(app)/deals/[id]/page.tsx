import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { getDealStageLabel, getActivityTypeLabel, getPrimaryBooking } from "@/lib/types";
import Link from "next/link";
import { EditDealDialog } from "@/components/deals/edit-deal-dialog";
import { OfferBookingSection } from "@/components/deals/offer-booking-section";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import type { Account, Booking, Deal, Profile } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("*, account:accounts(id, name), owner:profiles!deals_owner_id_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!deal) notFound();

  const [{ data: activities }, { data: tasks }, { data: profiles }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("activities")
        .select("*, creator:profiles!activities_created_by_fkey(full_name)")
        .eq("deal_id", id)
        .order("occurred_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)")
        .eq("deal_id", id)
        .order("due_at"),
      supabase.from("profiles").select("*").eq("org_id", profile.org_id),
      supabase
        .from("bookings")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: true }),
    ]);

  const primaryBooking = getPrimaryBooking((bookings || []) as Booking[]);
  const dealRecord = {
    ...deal,
    booking_create_declined: Boolean(deal.booking_create_declined),
    active_booking_declined: Boolean(deal.active_booking_declined),
  } as Deal;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/deals" className="text-sm text-muted-foreground hover:text-primary">
            &larr; Back to offers
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge>{getDealStageLabel(deal.stage)}</Badge>
              <Link
                href={`/accounts/${(deal.account as { id: string }).id}`}
                className="text-sm text-primary hover:underline"
              >
                {(deal.account as { name: string }).name}
              </Link>
            </div>
          </div>
        </div>
        <EditDealDialog deal={dealRecord} profiles={(profiles || []) as Profile[]} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(deal.value), deal.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Expected Close</p>
            <p className="text-2xl font-bold">
              {deal.expected_close ? formatDate(deal.expected_close) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Owner</p>
            <p className="text-2xl font-bold">
              {(deal.owner as { full_name: string } | null)?.full_name || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <OfferBookingSection
        deal={dealRecord}
        booking={
          primaryBooking
            ? ({
                ...primaryBooking,
                needs_confirmation: Boolean(primaryBooking.needs_confirmation),
              } as Booking)
            : null
        }
      />

      {deal.notes && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium">Notes</p>
            <p className="mt-2 text-muted-foreground">{deal.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Activities</h2>
            <LogActivityDialog
              accounts={
                [
                  {
                    id: (deal.account as { id: string }).id,
                    name: (deal.account as { name: string }).name,
                  },
                ] as Account[]
              }
              defaultAccountId={deal.account_id}
              defaultDealId={deal.id}
              buttonVariant="outline"
              buttonSize="sm"
              buttonLabel="Log activity"
            />
          </div>
          {!activities?.length ? (
            <p className="text-sm text-muted-foreground">No activities logged</p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{getActivityTypeLabel(activity.type)}</Badge>
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    {activity.body && (
                      <p className="mt-2 text-sm text-muted-foreground">{activity.body}</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {(activity.creator as { full_name: string } | null)?.full_name} &middot;{" "}
                      {formatDateTime(activity.occurred_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <CreateTaskDialog
              accounts={
                [
                  {
                    id: (deal.account as { id: string }).id,
                    name: (deal.account as { name: string }).name,
                  },
                ] as Account[]
              }
              profiles={(profiles || []) as Profile[]}
              defaultAccountId={deal.account_id}
              defaultDealId={deal.id}
              buttonVariant="outline"
              buttonSize="sm"
              buttonLabel="New task"
            />
          </div>
          {!tasks?.length ? (
            <p className="text-sm text-muted-foreground">No tasks for this offer</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(task.assignee as { full_name: string } | null)?.full_name}
                      </p>
                    </div>
                    <Badge variant={task.status === "done" ? "success" : "warning"}>
                      {task.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
