"use client";

import { useState } from "react";
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
import { DEAL_STAGES, DEAL_STAGE_LABELS } from "@/lib/types";
import type { Account, Profile } from "@/lib/types";
import { Plus } from "lucide-react";

export function CreateDealDialog({
  accounts,
  profiles,
}: {
  accounts: Account[];
  profiles: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createDeal(formData);
    setLoading(false);
    if (!result?.error) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Input id="title" name="title" required placeholder="Corporate spa package Q2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account_id">Client</Label>
            <NativeSelect id="account_id" name="account_id" required defaultValue="">
              <option value="" disabled>Select client</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue="0" />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <NativeSelect id="stage" name="stage" defaultValue="lead">
                {DEAL_STAGES.filter((s) => s !== "won" && s !== "lost").map((s) => (
                  <option key={s} value={s}>{DEAL_STAGE_LABELS[s]}</option>
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
              <NativeSelect id="owner_id" name="owner_id" defaultValue={profiles[0]?.id}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
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
  );
}
