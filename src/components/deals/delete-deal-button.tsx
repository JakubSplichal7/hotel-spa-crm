"use client";

import { deleteDeal } from "@/lib/actions/deals";
import { DeleteRowButton } from "@/components/delete-row-button";

export function DeleteDealButton({
  dealId,
  dealTitle,
}: {
  dealId: string;
  dealTitle: string;
}) {
  return (
    <DeleteRowButton
      id={dealId}
      name={dealTitle}
      entityLabel="offer"
      onDelete={deleteDeal}
      extraWarning="This cannot be undone and may remove linked booking data."
    />
  );
}
