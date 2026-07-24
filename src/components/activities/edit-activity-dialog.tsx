"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateActivity } from "@/lib/actions/activities";
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
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { Account, Activity } from "@/lib/types";

function toDatetimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditActivityDialog({
  activity,
  accounts,
  compact = false,
}: {
  activity: Activity;
  accounts: Account[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(activity.account_id || "");

  const hasEvent = Boolean(activity.event_id);
  const clientOptional = hasEvent;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (activity.deal_id) formData.set("deal_id", activity.deal_id);
    if (activity.event_id) formData.set("event_id", activity.event_id);

    const requiredFields = [{ name: "subject", label: "Subject" }];
    if (!clientOptional) {
      requiredFields.push({ name: "account_id", label: "Client" });
    }
    const missing = validateRequired(formData, requiredFields);
    if (missing) {
      setError(missing);
      return;
    }

    setLoading(true);
    const result = await updateActivity(activity.id, formData);
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
          setAccountId(activity.account_id || "");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        {compact ? (
          <EditIconTrigger label={`Edit ${activity.subject}`} />
        ) : (
          <Button type="button" variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor={`activity-account-${activity.id}`} required={!clientOptional}>
              Client{clientOptional ? " (optional)" : ""}
            </Label>
            <SearchableClientSelect
              id={`activity-account-${activity.id}`}
              accounts={accounts}
              value={accountId}
              onChange={setAccountId}
              required={!clientOptional}
              className="max-w-none"
              placeholder="Type client name…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`activity-type-${activity.id}`}>Type</Label>
            <NativeSelect
              id={`activity-type-${activity.id}`}
              name="type"
              defaultValue={activity.type}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`activity-subject-${activity.id}`} required>
              Subject
            </Label>
            <Input
              id={`activity-subject-${activity.id}`}
              name="subject"
              required
              defaultValue={activity.subject}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`activity-body-${activity.id}`}>Details</Label>
            <Textarea
              id={`activity-body-${activity.id}`}
              name="body"
              defaultValue={activity.body || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`activity-when-${activity.id}`}>Date & time</Label>
            <Input
              id={`activity-when-${activity.id}`}
              name="occurred_at"
              type="datetime-local"
              defaultValue={toDatetimeLocal(activity.occurred_at)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
