"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBookingFromDeal,
  declineLinkedBookingForStage,
} from "@/lib/actions/deals";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { ConfirmLinkedBookingDialog } from "@/components/deals/confirm-linked-booking-dialog";
import {
  BOOKING_STATUS_LABELS,
  expectedBookingStatusForStage,
  type Booking,
  type DealStage,
} from "@/lib/types";

function needsLinkedBookingPrompt(
  stage: DealStage,
  booking: Booking | null | undefined
): boolean {
  const expected = expectedBookingStatusForStage(stage);
  if (!expected) return false;
  if (!booking || booking.status === "cancelled") return true;
  if (booking.needs_confirmation || booking.status === "draft") return true;
  return booking.status !== expected;
}

export function shouldPromptLinkedBooking(
  stage: DealStage,
  booking: Booking | null | undefined
): boolean {
  return needsLinkedBookingPrompt(stage, booking);
}

function promptCopy(stage: DealStage, hasBooking: boolean) {
  const expected = expectedBookingStatusForStage(stage);
  const expectedLabel = expected
    ? BOOKING_STATUS_LABELS[expected]
    : "matching";

  if (hasBooking) {
    return {
      title: "Adjust linked booking?",
      description: `This offer is at a stage that needs a ${expectedLabel} booking. Review and update the linked booking now?`,
      yesLabel: "Yes, adjust booking",
      noLabel: "Not now",
    };
  }

  return {
    title: "Create linked booking?",
    description: `This offer is at a stage that needs a ${expectedLabel} booking. Create one now so you can set dates and details?`,
    yesLabel: "Yes, create booking",
    noLabel: "Not now",
  };
}

/**
 * Soft prompt after an offer enters Proposal / Negotiation / Won / Completed.
 * Yes → create or open adjust/confirm form. No / dismiss → stage decline flag.
 */
export function RequireLinkedBookingPrompt({
  open,
  onOpenChange,
  dealId,
  dealStage,
  booking,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string | null;
  dealStage: DealStage | null;
  booking?: Booking | null;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (open) resolvedRef.current = false;
  }, [open]);

  const hasBooking = Boolean(booking && booking.status !== "cancelled");
  const copy =
    dealStage != null
      ? promptCopy(dealStage, hasBooking)
      : promptCopy("proposal", false);

  async function handleDecline() {
    if (!dealId || !dealStage) return;
    setLoading(true);
    await declineLinkedBookingForStage(dealId, dealStage);
    setLoading(false);
    onOpenChange(false);
    onDone?.();
    router.refresh();
  }

  async function handleYes() {
    if (!dealId) return;
    resolvedRef.current = true;
    setLoading(true);
    const result = await createBookingFromDeal(dealId);
    setLoading(false);
    onOpenChange(false);
    if (result?.error) return;
    if (result.data) setConfirmBooking(result.data as Booking);
    onDone?.();
    router.refresh();
  }

  async function handleNo() {
    resolvedRef.current = true;
    await handleDecline();
  }

  return (
    <>
      <ConfirmYesNoDialog
        open={open && !!dealId && !!dealStage}
        onOpenChange={(next) => {
          if (!next && !resolvedRef.current) {
            resolvedRef.current = true;
            void handleDecline();
            return;
          }
          onOpenChange(next);
        }}
        title={copy.title}
        description={copy.description}
        yesLabel={copy.yesLabel}
        noLabel={copy.noLabel}
        loading={loading}
        onYes={handleYes}
        onNo={handleNo}
      />

      {confirmBooking && dealStage ? (
        <ConfirmLinkedBookingDialog
          booking={confirmBooking}
          dealStage={dealStage}
          open={!!confirmBooking}
          mode={hasBooking ? "adjust" : "confirm"}
          onOpenChange={(next) => {
            if (!next) setConfirmBooking(null);
          }}
          onConfirmed={() => {
            setConfirmBooking(null);
            onDone?.();
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
