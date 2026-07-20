"use client";

import { deleteActivity } from "@/lib/actions/activities";
import { DeleteRowButton } from "@/components/delete-row-button";

export function DeleteActivityButton({
  activityId,
  activitySubject,
}: {
  activityId: string;
  activitySubject: string;
}) {
  return (
    <DeleteRowButton
      id={activityId}
      name={activitySubject}
      entityLabel="activity"
      onDelete={deleteActivity}
    />
  );
}
