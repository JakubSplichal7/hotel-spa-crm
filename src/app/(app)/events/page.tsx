import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateEventDialog } from "@/components/events/create-event-dialog";
import { EventsTable } from "@/components/events/events-table";
import { PageHeader } from "@/components/page-header";
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

  const rows = ((events || []) as Event[]).map((event) => ({
    ...event,
    guestCount: countByEvent.get(event.id) || 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Plan events, invite guests, and track activities and tasks"
      >
        <CreateEventDialog />
      </PageHeader>

      {!rows.length ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3
            className={
              "text-lg font-bold tracking-tight text-slate-950 " +
              "[text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_12px_rgba(255,255,255,0.85),0_2px_8px_rgba(255,255,255,0.7)]"
            }
          >
            No events yet
          </h3>
          <p
            className={
              "mt-2 max-w-sm text-sm font-semibold text-slate-900 " +
              "[text-shadow:0_1px_2px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.8)]"
            }
          >
            Create your first event to start inviting guests and logging work.
          </p>
          <div className="mt-4">
            <CreateEventDialog />
          </div>
        </div>
      ) : (
        <EventsTable rows={rows} />
      )}
    </div>
  );
}
