"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/lib/actions/tasks";
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
import type { Account, Profile } from "@/lib/types";
import { Plus } from "lucide-react";

export function CreateTaskDialog({
  accounts,
  profiles,
  defaultAccountId,
  defaultDealId,
  buttonVariant = "default",
  buttonSize = "default",
  buttonLabel = "New Task",
}: {
  accounts: Account[];
  profiles: Profile[];
  defaultAccountId?: string;
  defaultDealId?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createTask(formData);
    setLoading(false);
    if (!result?.error) {
      setOpen(false);
      router.refresh();
    }
  }

  const lockedClient = Boolean(defaultAccountId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Plus className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {defaultDealId && (
            <input type="hidden" name="deal_id" value={defaultDealId} />
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Task</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Send proposal"
            />
          </div>
          {lockedClient ? (
            <input type="hidden" name="account_id" value={defaultAccountId} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="account_id">Client (optional)</Label>
              <NativeSelect id="account_id" name="account_id" defaultValue="">
                <option value="">No client</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="due_at">Due date</Label>
            <Input id="due_at" name="due_at" type="datetime-local" />
          </div>
          {profiles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="assignee_id">Assign to</Label>
              <NativeSelect
                id="assignee_id"
                name="assignee_id"
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
          {profiles.length === 1 && (
            <input type="hidden" name="assignee_id" value={profiles[0]?.id} />
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
