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
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const missing = validateRequired(formData, [
      { name: "completed_at", label: "Done on" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    const date = String(formData.get("completed_at") || "").trim();
    setLoading(true);
    const result = await updateTaskStatus(taskId, "done", date);
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
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="completed_at" required>
              Done on
            </Label>
            <Input
              id="completed_at"
              name="completed_at"
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
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Mark done"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
