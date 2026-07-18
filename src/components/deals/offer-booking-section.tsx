"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  activateBookingForDeal,
  cancelBookingForLostDeal,
  completeBookingForDeal,
  createBookingFromDeal,
  declineActiveBooking,
  declineBookingCreate,
  declineCompletedBooking,
  setOptionBookingForDeal,
  updateDealStage,
} from "@/lib/actions/deals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { ConfirmLinkedBookingDialog } from "@/components/deals/confirm-linked-booking-dialog";
import { MarkLostDialog } from "@/components/deals/mark-lost-dialog";
import {
  BOOKING_STATUS_LABELS,
  DEAL_STAGE_LABELS,
  dealStageNeedsBooking,
  getOfferBookingHealth,
  offerBookingHealthLabel,
  type Booking,
  type Deal,
  type DealLostReason,
  type DealStage,
} from "@/lib/types";

type PromptKind = "option" | "activate" | "complete" | "cancel_on_lost" | null;

export function OfferBookingSection({
  deal,
  booking,
}: {
  deal: Deal;
  booking: Booking | null;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptKind>(null);
  /** Only set by the "Create linked booking" button — never on mount */
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [pendingLost, setPendingLost] = useState<{
    lostReason: DealLostReason;
    lostComment: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);

  const health = getOfferBookingHealth(deal.stage, booking, {
    booking_create_declined: deal.booking_create_declined,
    active_booking_declined: deal.active_booking_declined,
    completed_booking_declined: deal.completed_booking_declined,
  });

  async function applyLost(lost: {
    lostReason: DealLostReason;
    lostComment: string;
  }) {
    const result = await updateDealStage(deal.id, "lost", lost);
    if (result?.error) {
      setStageError(result.error);
      return false;
    }
    setStageError(null);
    return true;
  }

  async function handleCreateYes() {
    setLoading(true);
    const result = await createBookingFromDeal(deal.id);
    setLoading(false);
    if (result?.error) return;
    setCreateDialogOpen(false);
    if (result.data) setConfirmBooking(result.data as Booking);
    router.refresh();
  }

  async function handleCreateNo() {
    setLoading(true);
    await declineBookingCreate(deal.id);
    setLoading(false);
    setCreateDialogOpen(false);
    router.refresh();
  }

  async function handleOptionYes() {
    setLoading(true);
    const result = await setOptionBookingForDeal(deal.id);
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

  async function handleOptionNo() {
    setPrompt(null);
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

  async function handleCompleteYes() {
    setLoading(true);
    const result = await completeBookingForDeal(deal.id);
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

  async function handleCompleteNo() {
    setLoading(true);
    await declineCompletedBooking(deal.id);
    setLoading(false);
    setPrompt(null);
    router.refresh();
  }

  async function handleLostCancelYes() {
    if (!pendingLost) return;
    setLoading(true);
    await cancelBookingForLostDeal(deal.id);
    const ok = await applyLost(pendingLost);
    setLoading(false);
    if (!ok) return;
    setPendingLost(null);
    setPrompt(null);
    router.refresh();
  }

  async function handleLostCancelNo() {
    if (!pendingLost) return;
    setLoading(true);
    const ok = await applyLost(pendingLost);
    setLoading(false);
    if (!ok) return;
    setPendingLost(null);
    setPrompt(null);
    router.refresh();
  }

  async function handleLostConfirm(lost: {
    lostReason: DealLostReason;
    lostComment: string;
  }) {
    setLostDialogOpen(false);

    if (
      booking &&
      booking.status !== "cancelled" &&
      booking.status !== "completed"
    ) {
      setPendingLost(lost);
      setPrompt("cancel_on_lost");
      return;
    }

    setLoading(true);
    const ok = await applyLost(lost);
    setLoading(false);
    if (!ok) {
      setLostDialogOpen(true);
      return;
    }
    router.refresh();
  }

  async function handleStageClick(stage: DealStage) {
    if (stage === deal.stage || loading) return;
    setStageError(null);

    if (stage === "lost") {
      setLostDialogOpen(true);
      return;
    }

    setLoading(true);
    const result = await updateDealStage(deal.id, stage);
    setLoading(false);
    if (result?.error) {
      setStageError(result.error);
      return;
    }
    router.refresh();

    if (
      (stage === "proposal" || stage === "negotiation") &&
      booking &&
      booking.status !== "option" &&
      booking.status !== "cancelled"
    ) {
      setPrompt("option");
      return;
    }

    if (
      stage === "won" &&
      booking &&
      booking.status !== "active" &&
      booking.status !== "cancelled"
    ) {
      setPrompt("activate");
      return;
    }

    if (
      stage === "completed" &&
      booking &&
      booking.status !== "completed" &&
      booking.status !== "cancelled"
    ) {
      setPrompt("complete");
    }
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Linked booking</p>
            {health !== "ok" && (
              <Badge variant="warning">{offerBookingHealthLabel(health)}</Badge>
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
                {(deal.stage === "proposal" || deal.stage === "negotiation") &&
                  booking.status !== "option" &&
                  booking.status !== "cancelled" &&
                  !booking.needs_confirmation &&
                  booking.status !== "draft" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPrompt("option")}
                    >
                      Set Option
                    </Button>
                  )}
                {deal.stage === "won" &&
                  booking.status !== "active" &&
                  booking.status !== "cancelled" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPrompt("activate")}
                    >
                      Set Active
                    </Button>
                  )}
                {deal.stage === "completed" &&
                  booking.status !== "completed" &&
                  booking.status !== "cancelled" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPrompt("complete")}
                    >
                      Set Completed
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
                  onClick={() => setCreateDialogOpen(true)}
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

          {deal.stage === "completed" &&
            deal.completed_booking_declined &&
            (!booking || booking.status !== "completed") && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Flag: this offer does not have a Completed booking.
              </p>
            )}

          {(deal.stage === "proposal" || deal.stage === "negotiation") &&
            deal.booking_create_declined &&
            !booking && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Flag: this offer does not have an Option booking.
              </p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-medium">Update Stage</p>
          {stageError && (
            <div className="mb-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {stageError}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(
              [
                "lead",
                "qualified",
                "proposal",
                "negotiation",
                "won",
                "completed",
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

      <MarkLostDialog
        open={lostDialogOpen}
        onOpenChange={setLostDialogOpen}
        loading={loading}
        defaultReason={deal.lost_reason}
        defaultComment={deal.lost_comment}
        onConfirm={handleLostConfirm}
      />

      {createDialogOpen ? (
        <ConfirmYesNoDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          title="Create linked booking?"
          description="This offer is in a stage that should have a booking. Create a Draft booking now so you can confirm dates and details?"
          yesLabel="Yes, create"
          noLabel="No"
          loading={loading}
          onYes={handleCreateYes}
          onNo={handleCreateNo}
        />
      ) : null}

      {prompt === "option" ? (
        <ConfirmYesNoDialog
          open
          onOpenChange={(open) => !open && setPrompt(null)}
          title="Set booking to Option?"
          description="This offer is at Proposal/Negotiation. Move the linked booking to Option?"
          yesLabel="Yes, set Option"
          noLabel="No"
          loading={loading}
          onYes={handleOptionYes}
          onNo={handleOptionNo}
        />
      ) : null}

      {prompt === "activate" ? (
        <ConfirmYesNoDialog
          open
          onOpenChange={(open) => !open && setPrompt(null)}
          title="Set booking to Active?"
          description="This offer is Won. Move the linked booking to Active?"
          yesLabel="Yes, set Active"
          noLabel="No"
          loading={loading}
          onYes={handleActivateYes}
          onNo={handleActivateNo}
        />
      ) : null}

      {prompt === "complete" ? (
        <ConfirmYesNoDialog
          open
          onOpenChange={(open) => !open && setPrompt(null)}
          title="Set booking to Completed?"
          description="This offer is Completed. Move the linked booking to Completed?"
          yesLabel="Yes, set Completed"
          noLabel="No"
          loading={loading}
          onYes={handleCompleteYes}
          onNo={handleCompleteNo}
        />
      ) : null}

      {prompt === "cancel_on_lost" ? (
        <ConfirmYesNoDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setPrompt(null);
              setPendingLost(null);
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
      ) : null}

      {confirmBooking ? (
        <ConfirmLinkedBookingDialog
          booking={confirmBooking}
          dealStage={deal.stage}
          open={!!confirmBooking}
          onOpenChange={(open) => !open && setConfirmBooking(null)}
          onConfirmed={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
