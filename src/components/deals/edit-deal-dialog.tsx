"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateDeal } from "@/lib/actions/deals";
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
import {
  DEAL_LOST_REASONS,
  DEAL_LOST_REASON_LABELS,
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  type DealLostReason,
  type DealStage,
} from "@/lib/types";
import type { Deal, Profile } from "@/lib/types";
import { Pencil } from "lucide-react";

export function EditDealDialog({
  deal,
  profiles,
}: {
  deal: Deal;
  profiles: Profile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const [lostReason, setLostReason] = useState<DealLostReason | "">(
    deal.lost_reason || ""
  );
  const [lostComment, setLostComment] = useState(deal.lost_comment || "");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("stage", stage);
    if (stage === "lost") {
      formData.set("lost_reason", lostReason);
      formData.set("lost_comment", lostComment);
    }
    const result = await updateDeal(deal.id, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setStage(deal.stage);
          setLostReason(deal.lost_reason || "");
          setLostComment(deal.lost_comment || "");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit offer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Offer</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Offer title</Label>
            <Input id="title" name="title" required defaultValue={deal.title} />
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
                defaultValue={Number(deal.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <NativeSelect
                id="currency"
                name="currency"
                defaultValue={deal.currency || "EUR"}
              >
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
              <NativeSelect
                id="stage"
                name="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
              >
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {DEAL_STAGE_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expected_close">Expected close</Label>
              <Input
                id="expected_close"
                name="expected_close"
                type="date"
                defaultValue={deal.expected_close || ""}
              />
            </div>
          </div>
          {stage === "lost" ? (
            <div className="space-y-4 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <div className="space-y-2">
                <Label htmlFor="lost_reason">Lost reason</Label>
                <NativeSelect
                  id="lost_reason"
                  name="lost_reason"
                  value={lostReason}
                  onChange={(e) =>
                    setLostReason(e.target.value as DealLostReason | "")
                  }
                  required
                >
                  <option value="" disabled>
                    Select reason…
                  </option>
                  {DEAL_LOST_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {DEAL_LOST_REASON_LABELS[r]}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              {lostReason ? (
                <div className="space-y-2">
                  <Label htmlFor="lost_comment">Lost details</Label>
                  <Textarea
                    id="lost_comment"
                    name="lost_comment"
                    value={lostComment}
                    onChange={(e) => setLostComment(e.target.value)}
                    placeholder="Add more detail about why it was lost…"
                    required
                    rows={3}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="owner_id">Owner</Label>
            <NativeSelect
              id="owner_id"
              name="owner_id"
              defaultValue={deal.owner_id}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={deal.notes || ""} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
