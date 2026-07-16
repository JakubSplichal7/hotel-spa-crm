"use client";

import { useTransition } from "react";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { BOOKING_STATUSES } from "@/lib/types";
import type { BookingStatus } from "@/lib/types";

export function BookingStatusButtons({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: BookingStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {BOOKING_STATUSES.map((status) => (
        <Button
          key={status}
          type="button"
          size="sm"
          disabled={pending}
          variant={currentStatus === status ? "default" : "outline"}
          onClick={() => {
            startTransition(async () => {
              await updateBookingStatus(bookingId, status);
            });
          }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Button>
      ))}
    </div>
  );
}
