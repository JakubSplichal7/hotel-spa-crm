"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBookingFromDeal,
  createDeal,
  declineBookingCreate,
} from "@/lib/actions/deals";
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
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  dealStageNeedsBooking,
  type Account,
  type Booking,
  type DealStage,
  type Profile,
} from "@/lib/types";
import { Plus } from "lucide-react";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { ConfirmLinkedBookingDialog } from "@/components/deals/confirm-linked-booking-dialog";

export function CreateDealDialog({
  accounts,
  profiles,
}: {
  accounts: Account[];
  profiles: Profile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [createdStage, setCreatedStage] = useState<DealStage | null>(null);
  const [askBooking, setAskBooking] = useState(false);
  const [confirmBooking, setConfirmBooking] = useState<Booking | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const stage = ((formData.get("stage") as DealStage) || "lead") as DealStage;
    const result = await createDeal(formData);
    setLoading(false);
    if (result?.error || !result?.data) return;

    setOpen(false);
    router.refresh();

    if (dealStageNeedsBooking(stage)) {
      setCreatedDealId(result.data.id);
      setCreatedStage(stage);
      setAskBooking(true);
    }
  }

  async function handleCreateYes() {
    if (!createdDealId) return;
    setLoading(true);
    const result = await createBookingFromDeal(createdDealId);
    setLoading(false);
    setAskBooking(false);
    if (result?.error) return;
    if (result.data) setConfirmBooking(result.data as Booking);
    router.refresh();
  }

  async function handleCreateNo() {
    if (!createdDealId) return;
    setLoading(true);
    await declineBookingCreate(createdDealId);
    setLoading(false);
    setAskBooking(false);
    setCreatedDealId(null);
    router.refresh();
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setAccountId("");
        }}
      >
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Offer
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Offer / Package</DialogTitle>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Offer title</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Corporate spa package Q2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_id">Client</Label>
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
            <div className="grid grid-cols-2 gap-4">
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
                  <option value="CZK">CZK</option>
                  <option value="GBP">GBP</option>
                </NativeSelect>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <NativeSelect id="stage" name="stage" defaultValue="lead">
                  {DEAL_STAGES.filter(
                    (s) => s !== "won" && s !== "completed" && s !== "lost"
                  ).map((s) => (
                    <option key={s} value={s}>
                      {DEAL_STAGE_LABELS[s]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close">Expected close</Label>
                <Input id="expected_close" name="expected_close" type="date" />
              </div>
            </div>
            {profiles.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="owner_id">Owner</Label>
                <NativeSelect
                  id="owner_id"
                  name="owner_id"
                  defaultValue={profiles[0]?.id}
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Offer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmYesNoDialog
        open={askBooking}
        onOpenChange={(open) => !open && setAskBooking(false)}
        title="Create linked booking?"
        description="This offer is at Proposal or later. Create a Draft booking now to confirm dates and details?"
        yesLabel="Yes, create"
        noLabel="No"
        loading={loading}
        onYes={handleCreateYes}
        onNo={handleCreateNo}
      />

      {confirmBooking && (
        <ConfirmLinkedBookingDialog
          booking={confirmBooking}
          dealStage={createdStage}
          open={!!confirmBooking}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmBooking(null);
              setCreatedDealId(null);
            }
          }}
          onConfirmed={() => router.refresh()}
        />
      )}
    </>
  );
}
