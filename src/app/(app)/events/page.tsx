import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import type { Event } from "@/lib/types";

export default async function EventsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*, creator:profiles!events_created_by_fkey(full_name)")
    .eq("org_id", profile.org_id)
    .order("event_date", { ascending: true });

  const { data: guestCounts } = await supabase
    .from("event_guests")
    .select("event_id")
    .eq("org_id", profile.org_id);

  const countByEvent = new Map<string, number>();
  for (const g of guestCounts || []) {
    countByEvent.set(g.event_id, (countByEvent.get(g.event_id) || 0) + 1);
  }

  const rows = (events || []) as Event[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Plan events, invite guests, and track activities and tasks"
      >
        <CreateEventDialog />
      </PageHeader>

      {!rows.length ? (
        <EmptyState
          title="No events yet"
          description="Create your first event to start inviting guests and logging work."
          action={<CreateEventDialog />}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 font-medium">Event</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Guests</th>
                <th className="p-3 font-medium">Created by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => (
                <tr key={event.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="p-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {event.name}
                    </Link>
                  </td>
                  <td className="p-3">{formatDate(event.event_date)}</td>
                  <td className="p-3">{countByEvent.get(event.id) || 0}</td>
                  <td className="p-3 text-muted-foreground">
                    {(event.creator as { full_name?: string } | undefined)
                      ?.full_name || "—"}
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
