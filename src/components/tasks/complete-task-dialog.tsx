"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskStatus } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CompleteTaskDialog({
  open,
  onOpenChange,
  taskId,
  taskTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  taskTitle?: string;
}) {
  const router = useRouter();
  const [completedAt, setCompletedAt] = useState(todayDateString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!completedAt) {
      setError("Please choose a date");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await updateTaskStatus(taskId, "done", completedAt);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) {
          setCompletedAt(todayDateString());
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark task done</DialogTitle>
          <DialogDescription>
            {taskTitle
              ? `Choose the date you completed “${taskTitle}”.`
              : "Choose the date you completed this task."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="completed_at">Done on</Label>
            <Input
              id="completed_at"
              type="date"
              required
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={loading} onClick={handleConfirm}>
              {loading ? "Saving..." : "Mark done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
