"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDeal } from "@/lib/actions/deals";
import { Button } from "@/components/ui/button";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { DeleteLinkedBookingsCheckbox } from "@/components/deals/delete-linked-bookings-checkbox";
import { Trash2 } from "lucide-react";

export function DeleteDealButton({
  dealId,
  dealTitle,
}: {
  dealId: string;
  dealTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLinkedBookings, setDeleteLinkedBookings] = useState(false);

  async function handleYes() {
    setLoading(true);
    setError(null);
    const result = await deleteDeal(dealId, { deleteLinkedBookings });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${dealTitle}`}
        onClick={(e) => {
          e.stopPropagation();
          setError(null);
          setDeleteLinkedBookings(false);
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmYesNoDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setError(null);
            setDeleteLinkedBookings(false);
          }
        }}
        title="Delete offer?"
        description={
          error
            ? error
            : `Delete “${dealTitle}”? This cannot be undone.`
        }
        yesLabel="Delete"
        noLabel="Cancel"
        loading={loading}
        onYes={handleYes}
        onNo={() => setOpen(false)}
      >
        {!error ? (
          <DeleteLinkedBookingsCheckbox
            id={`delete-linked-bookings-${dealId}`}
            checked={deleteLinkedBookings}
            onCheckedChange={setDeleteLinkedBookings}
          />
        ) : null}
      </ConfirmYesNoDialog>
    </>
  );
}
