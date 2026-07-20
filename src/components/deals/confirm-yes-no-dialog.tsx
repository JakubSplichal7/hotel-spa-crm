"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmYesNoDialog({
  open,
  onOpenChange,
  title,
  description,
  yesLabel = "Yes",
  noLabel = "No",
  loading = false,
  onYes,
  onNo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  yesLabel?: string;
  noLabel?: string;
  loading?: boolean;
  onYes: () => void | Promise<void>;
  onNo: () => void | Promise<void>;
}) {
  const yesRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          yesRef.current?.focus();
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter" || loading) return;
          // Enter confirms even if focus is not on a button
          if (
            e.target instanceof HTMLButtonElement &&
            e.target !== yesRef.current
          ) {
            return;
          }
          e.preventDefault();
          void onYes();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={async () => {
              await onNo();
            }}
          >
            {noLabel}
          </Button>
          <Button
            ref={yesRef}
            type="button"
            disabled={loading}
            onClick={async () => {
              await onYes();
            }}
          >
            {loading ? "Working..." : yesLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
