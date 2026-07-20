"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEAL_LOST_REASONS,
  DEAL_LOST_REASON_LABELS,
  type DealLostReason,
} from "@/lib/types";

export function MarkLostDialog({
  open,
  onOpenChange,
  loading = false,
  defaultReason,
  defaultComment,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  defaultReason?: DealLostReason | null;
  defaultComment?: string | null;
  onConfirm: (data: {
    lostReason: DealLostReason;
    lostComment: string;
  }) => void | Promise<void>;
}) {
  const [reason, setReason] = useState<DealLostReason | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason(defaultReason || "");
      setComment(defaultComment || "");
      setError(null);
    }
  }, [open, defaultReason, defaultComment]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("Select a reason.");
      return;
    }
    if (!comment.trim()) {
      setError("Add a more detailed comment.");
      return;
    }
    setError(null);
    await onConfirm({ lostReason: reason, lostComment: comment.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark offer as Lost</DialogTitle>
          <DialogDescription>
            Choose why this offer was lost, then add a short detail.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="lost_reason" required>
              Reason
            </Label>
            <NativeSelect
              id="lost_reason"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as DealLostReason | "")
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
          {reason ? (
            <div className="space-y-2">
              <Label htmlFor="lost_comment" required>
                Details
              </Label>
              <Textarea
                id="lost_comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add more detail about why it was lost…"
                required
                rows={3}
              />
            </div>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !reason}>
              {loading ? "Saving..." : "Mark as Lost"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
