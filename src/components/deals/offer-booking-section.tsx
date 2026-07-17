"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  activateBookingForDeal,
  cancelBookingForLostDeal,
  createBookingFromDeal,
  declineActiveBooking,
  declineBookingCreate,
  updateDealStage,
} from "@/lib/actions/deals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { ConfirmLinkedBookingDialog } from "@/components/deals/confirm-linked-booking-dialog";
import {
  BOOKING_STATUS_LABELS,
  DEAL_STAGE_LABELS,
  dealStageNeedsBooking,
  getOfferBookingHealth,
  type Booking,
  type Deal,
  type DealStage,
} from "@/lib/types";

type PromptKind = "create" | "activate" | "cancel_on_lost" | null;

export function OfferBookingSection({
  deal,
  booking,
}: {
  deal: Deal;
  booking: Booking | null;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptKind>(null);
  const [pendingStage, setPendingStage] = useState<DealStage | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);

  const health = getOfferBookingHealth(deal.stage, booking, {
    booking_create_declined: deal.booking_create_declined,
    active_booking_declined: deal.active_booking_declined,
  });

  async function handleCreateYes() {
    setLoading(true);
    const result = await createBookingFromDeal(deal.id);
    setLoading(false);
    if (result?.error) return;
    setPrompt(null);
    if (result.data) setConfirmBooking(result.data as Booking);
    router.refresh();
  }

  async function handleCreateNo() {
    setLoading(true);
    await declineBookingCreate(deal.id);
    setLoading(false);
    setPrompt(null);
    router.refresh();
  }

  async function handleActivateYes() {
    setLoading(true);
    const result = await activateBookingForDeal(deal.id);
    setLoading(false);
    if (result?.error === "confirm_required" && booking) {
      setPrompt(null);
      setConfirmBooking(booking);
      return;
    }
    if (result?.error) return;
    setPrompt(null);
    router.refresh();
  }

  async function handleActivateNo() {
    setLoading(true);
    await declineActiveBooking(deal.id);
    setLoading(false);
    setPrompt(null);
    router.refresh();
  }

  async function handleLostCancelYes() {
    setLoading(true);
    await cancelBookingForLostDeal(deal.id);
    if (pendingStage) await updateDealStage(deal.id, pendingStage);
    setLoading(false);
    setPendingStage(null);
    setPrompt(null);
    router.refresh();
  }

  async function handleLostCancelNo() {
    if (pendingStage) {
      setLoading(true);
      await updateDealStage(deal.id, pendingStage);
      setLoading(false);
    }
    setPendingStage(null);
    setPrompt(null);
    router.refresh();
  }

  async function handleStageClick(stage: DealStage) {
    if (stage === deal.stage || loading) return;

    if (
      stage === "lost" &&
      booking &&
      booking.status !== "cancelled" &&
      booking.status !== "completed"
    ) {
      setPendingStage("lost");
      setPrompt("cancel_on_lost");
      return;
    }

    setLoading(true);
    await updateDealStage(deal.id, stage);
    setLoading(false);
    router.refresh();

    // Activate prompt only when moving to Won with an existing booking.
    // Missing booking: user clicks "Create linked booking" — no auto popup.
    if (
      stage === "won" &&
      booking &&
      booking.status !== "active" &&
      booking.status !== "completed" &&
      booking.status !== "cancelled"
    ) {
      setPrompt("activate");
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Linked booking</p>
            {health !== "ok" && (
              <Badge variant="warning">
                {health === "missing_booking" && "Missing booking"}
                {health === "needs_confirmation" && "Needs confirmation"}
                {health === "missing_active" && "No Active booking"}
                {health === "status_mismatch" && "Status mismatch"}
              </Badge>
            )}
          </div>

          {booking ? (
            <div className="space-y-2">
              <Link
                href={`/bookings/${booking.id}`}
                className="font-medium text-primary hover:underline"
              >
                {booking.title}
              </Link>
              <p className="text-sm text-muted-foreground">
                Status: {BOOKING_STATUS_LABELS[booking.status]}
                {booking.needs_confirmation ? " · awaiting confirmation" : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {(booking.needs_confirmation || booking.status === "draft") && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setConfirmBooking(booking)}
                  >
                    Confirm booking
                  </Button>
                )}
                {deal.stage === "won" &&
                  booking.status !== "active" &&
                  booking.status !== "completed" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPrompt("activate")}
                    >
                      Set Active
                    </Button>
                  )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {dealStageNeedsBooking(deal.stage)
                  ? deal.booking_create_declined
                    ? "No linked booking yet (you declined earlier)."
                    : "No linked booking yet."
                  : "Bookings are suggested from Proposal onward."}
              </p>
              {dealStageNeedsBooking(deal.stage) && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPrompt("create")}
                >
                  Create linked booking
                </Button>
              )}
            </div>
          )}

          {deal.stage === "won" &&
            deal.active_booking_declined &&
            (!booking || booking.status !== "active") && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Flag: this offer does not have an Active booking.
              </p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-medium">Update Stage</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                "lead",
                "qualified",
                "proposal",
                "negotiation",
                "won",
                "lost",
              ] as DealStage[]
            ).map((stage) => (
              <Button
                key={stage}
                type="button"
                variant={deal.stage === stage ? "default" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => handleStageClick(stage)}
              >
                {DEAL_STAGE_LABELS[stage]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ConfirmYesNoDialog
        open={prompt === "create"}
        onOpenChange={(open) => !open && setPrompt(null)}
        title="Create linked booking?"
        description="This offer is in a stage that should have a booking. Create a Draft booking now so you can confirm dates and details?"
        yesLabel="Yes, create"
        noLabel="No"
        loading={loading}
        onYes={handleCreateYes}
        onNo={handleCreateNo}
      />

      <ConfirmYesNoDialog
        open={prompt === "activate"}
        onOpenChange={(open) => !open && setPrompt(null)}
        title="Set booking to Active?"
        description="This offer is Won. Move the linked booking to Active?"
        yesLabel="Yes, set Active"
        noLabel="No"
        loading={loading}
        onYes={handleActivateYes}
        onNo={handleActivateNo}
      />

      <ConfirmYesNoDialog
        open={prompt === "cancel_on_lost"}
        onOpenChange={(open) => {
          if (!open) {
            setPrompt(null);
            setPendingStage(null);
          }
        }}
        title="Cancel linked booking?"
        description="This offer is being marked Lost. Cancel the linked booking as well?"
        yesLabel="Yes, cancel booking"
        noLabel="Keep booking"
        loading={loading}
        onYes={handleLostCancelYes}
        onNo={handleLostCancelNo}
      />

      {confirmBooking && (
        <ConfirmLinkedBookingDialog
          booking={confirmBooking}
          dealStage={deal.stage === "won" ? "won" : deal.stage}
          open={!!confirmBooking}
          onOpenChange={(open) => !open && setConfirmBooking(null)}
          onConfirmed={() => router.refresh()}
        />
      )}
    </>
  );
}
