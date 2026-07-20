"use client";

import { deleteEvent } from "@/lib/actions/events";
import { DeleteRowButton } from "@/components/delete-row-button";

export function DeleteEventButton({
  eventId,
  eventName,
}: {
  eventId: string;
  eventName: string;
}) {
  return (
    <DeleteRowButton
      id={eventId}
      name={eventName}
      entityLabel="event"
      onDelete={deleteEvent}
      extraWarning="This cannot be undone and will remove guests and linked items for this event."
    />
  );
}
