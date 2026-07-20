"use client";

import { DeleteEventButton } from "@/components/events/delete-event-button";
import {
  BulkRowCheckbox,
  BulkSelectAllCheckbox,
  BulkTableToolbar,
  bulkCheckboxCellClass,
  bulkCheckboxHeadClass,
  useBulkSelection,
} from "@/components/bulk-selection";
import {
  CompactDate,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";
import { deleteEvents } from "@/lib/actions/events";
import type { Event } from "@/lib/types";
import Link from "next/link";

export type EventTableRow = Event & {
  guestCount: number;
};

export function EventsTable({ rows }: { rows: EventTableRow[] }) {
  const selection = useBulkSelection(rows.map((r) => r.id));

  return (
    <div>
      <BulkTableToolbar
        selection={selection}
        entityLabel="event"
        onDelete={deleteEvents}
        showExport={false}
      />
      <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className={`${bulkCheckboxHeadClass} p-3`}>
                <BulkSelectAllCheckbox selection={selection} />
              </th>
              <th className="p-3 font-medium">Event</th>
              <th className={`${dateColHeadClass} p-3`}>Date</th>
              <th className="p-3 font-medium">Guests</th>
              <th className="p-3 font-medium">Created by</th>
              <th className="w-12 p-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((event) => (
              <tr
                key={event.id}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className={`${bulkCheckboxCellClass} p-3`}>
                  <BulkRowCheckbox id={event.id} selection={selection} />
                </td>
                <td className="p-3">
                  <Link
                    href={`/events/${event.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {event.name}
                  </Link>
                </td>
                <td className={`${dateColCellClass} p-3`}>
                  <CompactDate value={event.event_date} />
                </td>
                <td className="p-3">{event.guestCount}</td>
                <td className="p-3 text-muted-foreground">
                  {(event.creator as { full_name?: string } | undefined)
                    ?.full_name || "—"}
                </td>
                <td className="p-3 text-right">
                  <DeleteEventButton
                    eventId={event.id}
                    eventName={event.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
