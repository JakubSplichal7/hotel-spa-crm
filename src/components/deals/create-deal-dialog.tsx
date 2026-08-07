"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDeal } from "@/lib/actions/deals";
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
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  dealStageNeedsBooking,
  type Account,
  type DealStage,
  type Profile,
} from "@/lib/types";
import { Plus } from "lucide-react";
import { RequireLinkedBookingPrompt } from "@/components/deals/require-linked-booking-prompt";

export function CreateDealDialog({
  accounts,
  profiles,
  defaultAccountId,
  buttonVariant = "default",
  buttonSize = "default",
  buttonLabel = "New Offer",
}: {
  accounts: Account[];
  profiles: Profile[];
  defaultAccountId?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(defaultAccountId || "");
  const [createdDealId, setCreatedDealId] = useState<string | null>(null);
  const [createdStage, setCreatedStage] = useState<DealStage | null>(null);
  const [askBooking, setAskBooking] = useState(false);

  const lockedClient = Boolean(defaultAccountId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (lockedClient && defaultAccountId) {
      formData.set("account_id", defaultAccountId);
    }
    const missing = validateRequired(formData, [
      { name: "title", label: "Offer title" },
      { name: "account_id", label: "Client" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    setLoading(true);
    const stage = ((formData.get("stage") as DealStage) || "lead") as DealStage;
    const result = await createDeal(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    if (!result?.data) return;

    setOpen(false);
    setAccountId(defaultAccountId || "");
    form.reset();
    router.refresh();

    if (dealStageNeedsBooking(stage)) {
      setCreatedDealId(result.data.id);
      setCreatedStage(stage);
      setAskBooking(true);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setAccountId(defaultAccountId || "");
            setError(null);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant={buttonVariant} size={buttonSize}>
            <Plus className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Offer / Package</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormError message={error} />
            <div className="space-y-2">
              <Label htmlFor="title" required>
                Offer title
              </Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Corporate spa package Q2"
              />
            </div>
            {lockedClient ? (
              <input type="hidden" name="account_id" value={defaultAccountId} />
            ) : (
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
            )}
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
                  <option value="CZK">CZK</option>
                </NativeSelect>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <NativeSelect id="stage" name="stage" defaultValue="lead">
                  {DEAL_STAGES.filter((s) => s !== "lost").map((s) => (
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

      <RequireLinkedBookingPrompt
        open={askBooking}
        onOpenChange={(next) => {
          setAskBooking(next);
          if (!next) {
            setCreatedDealId(null);
            setCreatedStage(null);
          }
        }}
        dealId={createdDealId}
        dealStage={createdStage}
        booking={null}
      />
    </>
  );
}
