"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { EditIconTrigger } from "@/components/edit-icon-trigger";
import { validateRequired } from "@/lib/form-validation";
import type { Account, Profile, Task } from "@/lib/types";

export function EditTaskDialog({
  task,
  accounts,
  profiles,
  compact = false,
}: {
  task: Task;
  accounts: Account[];
  profiles: Profile[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(task.account_id || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (task.deal_id) formData.set("deal_id", task.deal_id);
    if (task.event_id) formData.set("event_id", task.event_id);

    const missing = validateRequired(formData, [
      { name: "title", label: "Task" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }

    setLoading(true);
    const result = await updateTask(task.id, formData);
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
          setAccountId(task.account_id || "");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {compact ? (
          <EditIconTrigger label={`Edit ${task.title}`} />
        ) : (
          <Button type="button" variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor={`task-title-${task.id}`} required>
              Task
            </Label>
            <Input
              id={`task-title-${task.id}`}
              name="title"
              required
              defaultValue={task.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`task-account-${task.id}`}>Client (optional)</Label>
            <SearchableClientSelect
              id={`task-account-${task.id}`}
              accounts={accounts}
              value={accountId}
              onChange={setAccountId}
              className="max-w-none"
              placeholder="Type client name…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`task-due-${task.id}`}>Due date</Label>
            <Input
              id={`task-due-${task.id}`}
              name="due_at"
              type="date"
              defaultValue={task.due_at?.slice(0, 10) || ""}
            />
          </div>
          {profiles.length > 1 ? (
            <div className="space-y-2">
              <Label htmlFor={`task-assignee-${task.id}`}>Assign to</Label>
              <NativeSelect
                id={`task-assignee-${task.id}`}
                name="assignee_id"
                defaultValue={task.assignee_id || profiles[0]?.id}
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <input
              type="hidden"
              name="assignee_id"
              value={task.assignee_id || profiles[0]?.id || ""}
            />
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
