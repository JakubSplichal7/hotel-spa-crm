import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getActivityTypeLabel } from "@/lib/types";
import Link from "next/link";
import { EditEventDialog } from "@/components/events/edit-event-dialog";
import { AddEventGuestDialog } from "@/components/events/add-event-guest-dialog";
import { RemoveEventGuestButton } from "@/components/events/remove-event-guest-button";
import { LogActivityDialog } from "@/components/activities/log-activity-dialog";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import type { Account, Event, EventGuest, Profile } from "@/lib/types";

const titleShadow =
  "text-slate-950 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_12px_rgba(255,255,255,0.85),0_2px_8px_rgba(255,255,255,0.7)]";
const textShadow =
  "text-slate-900 [text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, creator:profiles!events_created_by_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!event) notFound();

  const [
    { data: guests },
    { data: activities },
    { data: tasks },
    { data: profiles },
    { data: accounts },
  ] = await Promise.all([
    supabase
      .from("event_guests")
      .select("*")
      .eq("event_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("activities")
      .select("*, creator:profiles!activities_created_by_fkey(full_name)")
      .eq("event_id", id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)")
      .eq("event_id", id)
      .order("due_at"),
    supabase.from("profiles").select("*").eq("org_id", profile.org_id),
    supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
  ]);

  const eventRecord = event as Event;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/events"
            className={`text-sm font-semibold ${textShadow} hover:text-primary`}
          >
            &larr; Back to events
          </Link>
          <div className="mt-2">
            <h1 className={`text-3xl font-bold tracking-tight ${titleShadow}`}>
              {event.name}
            </h1>
            <p className={`mt-2 text-sm font-semibold ${textShadow}`}>
              {formatDate(event.event_date)}
              {(event.creator as { full_name?: string } | null)?.full_name
                ? ` · ${(event.creator as { full_name: string }).full_name}`
                : ""}
            </p>
          </div>
        </div>
        <EditEventDialog event={eventRecord} />
      </div>

      {event.notes && (
        <div>
          <p className={`text-sm font-semibold ${textShadow}`}>Notes</p>
          <p className={`mt-2 text-sm font-semibold ${textShadow}`}>
            {event.notes}
          </p>
        </div>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className={`text-lg font-bold ${titleShadow}`}>Invited guests</h2>
          <AddEventGuestDialog eventId={event.id} />
        </div>
        {!guests?.length ? (
          <p className={`text-sm font-semibold ${textShadow}`}>
            No guests invited yet
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Phone</th>
                  <th className="p-3 font-medium">Notes</th>
                  <th className="p-3 font-medium w-12" />
                </tr>
              </thead>
              <tbody>
                {(guests as EventGuest[]).map((guest) => (
                  <tr key={guest.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{guest.name}</td>
                    <td className="p-3 text-muted-foreground">
                      {guest.email || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {guest.phone || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {guest.notes || "—"}
                    </td>
                    <td className="p-3">
                      <RemoveEventGuestButton
                        guestId={guest.id}
                        eventId={event.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className={`text-lg font-bold ${titleShadow}`}>Activities</h2>
            <LogActivityDialog
              accounts={(accounts || []) as Account[]}
              defaultEventId={event.id}
              buttonVariant="outline"
              buttonSize="sm"
              buttonLabel="Log activity"
            />
          </div>
          {!activities?.length ? (
            <p className={`text-sm font-semibold ${textShadow}`}>
              No activities logged
            </p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="block"
                >
                  <Card className="hover:bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {getActivityTypeLabel(activity.type)}
                        </Badge>
                        <span className="font-medium text-primary hover:underline">
                          {activity.subject}
                        </span>
                      </div>
                      {activity.body && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {activity.body}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {(activity.creator as { full_name: string } | null)
                          ?.full_name}{" "}
                        &middot; {formatDateTime(activity.occurred_at)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className={`text-lg font-bold ${titleShadow}`}>Tasks</h2>
            <CreateTaskDialog
              accounts={(accounts || []) as Account[]}
              profiles={(profiles || []) as Profile[]}
              defaultEventId={event.id}
              buttonVariant="outline"
              buttonSize="sm"
              buttonLabel="New task"
            />
          </div>
          {!tasks?.length ? (
            <p className={`text-sm font-semibold ${textShadow}`}>
              No tasks for this event
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="block">
                  <Card className="hover:bg-muted/30">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-primary hover:underline">
                          {task.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(task.assignee as { full_name: string } | null)
                            ?.full_name}
                          {task.due_at ? ` · due ${formatDate(task.due_at)}` : ""}
                        </p>
                      </div>
                      <Badge
                        variant={task.status === "done" ? "success" : "warning"}
                      >
                        {task.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
