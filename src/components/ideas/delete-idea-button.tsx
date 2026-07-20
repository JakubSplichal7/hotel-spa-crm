"use client";

import { deleteIdea } from "@/lib/actions/ideas";
import { DeleteRowButton } from "@/components/delete-row-button";

export function DeleteIdeaButton({
  ideaId,
  ideaName,
}: {
  ideaId: string;
  ideaName: string;
}) {
  return (
    <DeleteRowButton
      id={ideaId}
      name={ideaName}
      entityLabel="idea"
      onDelete={deleteIdea}
    />
  );
}
