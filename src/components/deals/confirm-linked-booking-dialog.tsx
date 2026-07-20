"use client";

import { useState } from "react";
import { confirmLinkedBooking } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABELS,
  type Booking,
  type BookingStatus,
  type DealStage,
} from "@/lib/types";

function defaultStatusForStage(stage?: DealStage | null): BookingStatus {
  if (stage === "completed") return "completed";
  if (stage === "won") return "active";
  return "option";
}

export function ConfirmLinkedBookingDialog({
  booking,
  dealStage,
  open,
  onOpenChange,
  onConfirmed,
}: {
  booking: Booking;
  dealStage?: DealStage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggested = defaultStatusForStage(dealStage);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const missing = validateRequired(formData, [
      { name: "title", label: "Title" },
      { name: "start_date", label: "Start date" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }

    const startDate = (formData.get("start_date") as string) || "";
    const endDate = (formData.get("end_date") as string) || "";
    if (startDate && endDate && endDate < startDate) {
      setError(
        "Booking cannot be confirmed: end date cannot be earlier than start date. Please correct the dates and try again."
      );
      return;
    }

    setLoading(true);
    const result = await confirmLinkedBooking(booking.id, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onConfirmed?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setError(null);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm booking</DialogTitle>
          <DialogDescription>
            Review dates and details. Confirming moves this booking out of Draft
            {suggested === "active"
              ? " to Active"
              : suggested === "completed"
                ? " to Completed"
                : " to Option"}
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="confirm_title" required>
              Title
            </Label>
            <Input
              id="confirm_title"
              name="title"
              required
              defaultValue={booking.title}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="confirm_start_date" required>
                Start date
              </Label>
              <Input
                id="confirm_start_date"
                name="start_date"
                type="date"
                required
                defaultValue={booking.start_date || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_end_date">End date</Label>
              <Input
                id="confirm_end_date"
                name="end_date"
                type="date"
                defaultValue={booking.end_date || ""}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="confirm_value">Value</Label>
              <Input
                id="confirm_value"
                name="value"
                type="number"
                min="0"
                step="0.01"
                defaultValue={Number(booking.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_currency">Currency</Label>
              <NativeSelect
                id="confirm_currency"
                name="currency"
                defaultValue={booking.currency || "EUR"}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CZK">CZK</option>
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_status">Status after confirm</Label>
            <NativeSelect
              id="confirm_status"
              name="status"
              defaultValue={suggested}
            >
              {BOOKING_STATUSES.filter((s) => s !== "draft").map((s) => (
                <option key={s} value={s}>
                  {BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_notes">Notes</Label>
            <Textarea
              id="confirm_notes"
              name="notes"
              defaultValue={booking.notes || ""}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Confirming..." : "Confirm booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
