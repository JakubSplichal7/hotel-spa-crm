"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmLinkedBookingDialog } from "@/components/deals/confirm-linked-booking-dialog";
import type { Booking, DealStage } from "@/lib/types";

export function ConfirmBookingButton({
  booking,
  dealStage,
}: {
  booking: Booking;
  dealStage?: DealStage | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        Confirm booking
      </Button>
      <ConfirmLinkedBookingDialog
        booking={booking}
        dealStage={dealStage}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
