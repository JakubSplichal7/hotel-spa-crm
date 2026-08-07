"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTask } from "@/lib/actions/tasks";
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
import { EditIconTrigger } from "@/components/edit-icon-trigger";
import { validateRequired } from "@/lib/form-validation";
import type { Account, Profile, Task } from "@/lib/types";

export type TaskOfferOption = {
  id: string;
  title: string;
  account_id: string;
};

export function EditTaskDialog({
  task,
  accounts,
  profiles,
  offers = [],
  compact = false,
}: {
  task: Task;
  accounts: Account[];
  profiles: Profile[];
  offers?: TaskOfferOption[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(task.account_id || "");
  const [dealId, setDealId] = useState(task.deal_id || "");

  const clientOffers = useMemo(() => {
    if (!accountId) return offers;
    return offers.filter((o) => o.account_id === accountId);
  }, [offers, accountId]);

  function handleAccountChange(nextAccountId: string) {
    setAccountId(nextAccountId);
    if (!dealId) return;
    const linked = offers.find((o) => o.id === dealId);
    if (linked && nextAccountId && linked.account_id !== nextAccountId) {
      setDealId("");
    }
  }

  function handleDealChange(nextDealId: string) {
    setDealId(nextDealId);
    if (!nextDealId) return;
    const offer = offers.find((o) => o.id === nextDealId);
    if (offer) setAccountId(offer.account_id);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("account_id", accountId);
    formData.set("deal_id", dealId);
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
          setDealId(task.deal_id || "");
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor={`task-description-${task.id}`}>Description</Label>
            <Textarea
              id={`task-description-${task.id}`}
              name="description"
              rows={4}
              defaultValue={task.description || ""}
              placeholder="Add more detail about this task…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`task-account-${task.id}`}>Client (optional)</Label>
            <SearchableClientSelect
              id={`task-account-${task.id}`}
              accounts={accounts}
              value={accountId}
              onChange={handleAccountChange}
              className="max-w-none"
              placeholder="Type client name…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`task-deal-${task.id}`}>Offer (optional)</Label>
            <NativeSelect
              id={`task-deal-${task.id}`}
              name="deal_id"
              value={dealId}
              onChange={(e) => handleDealChange(e.target.value)}
            >
              <option value="">No offer</option>
              {clientOffers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </NativeSelect>
            {accountId && clientOffers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                This client has no offers yet.
              </p>
            ) : null}
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
