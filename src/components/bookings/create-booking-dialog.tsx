"use client";

import { useState } from "react";
import { createBooking } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchableClientSelect } from "@/components/searchable-client-select";
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";
import { BOOKING_STATUSES, BOOKING_STATUS_LABELS } from "@/lib/types";
import type { Account } from "@/lib/types";
import { Plus } from "lucide-react";

const DATE_RANGE_ERROR =
  "Booking cannot be created: end date cannot be earlier than start date. Please correct the dates and try again.";

export function CreateBookingDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const missing = validateRequired(formData, [
      { name: "title", label: "Title" },
      { name: "account_id", label: "Client" },
      { name: "start_date", label: "Start date" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }

    const startDate = (formData.get("start_date") as string) || "";
    const endDate = (formData.get("end_date") as string) || "";
    if (startDate && endDate && endDate < startDate) {
      setError(DATE_RANGE_ERROR);
      return;
    }

    setLoading(true);
    const result = await createBooking(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setAccountId("");
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAccountId("");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Booking / Stay</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="title" required>
              Title
            </Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Corporate retreat – May week"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_id" required>
              Client
            </Label>
            <SearchableClientSelect
              id="account_id"
              accounts={accounts}
              value={accountId}
              onChange={setAccountId}
              required
              className="max-w-none"
              placeholder="Type client name…"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date" required>
                Start date
              </Label>
              <Input id="start_date" name="start_date" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <NativeSelect id="currency" name="currency" defaultValue="EUR">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <NativeSelect id="status" name="status" defaultValue="draft">
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {BOOKING_STATUS_LABELS[s]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Booking"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
