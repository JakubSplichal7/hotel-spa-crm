"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions/activities";
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
import { validateRequired } from "@/lib/form-validation";
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { Account } from "@/lib/types";
import { Plus } from "lucide-react";

export function LogActivityDialog({
  accounts,
  defaultAccountId,
  defaultDealId,
  defaultEventId,
  buttonVariant = "default",
  buttonSize = "default",
  buttonLabel = "Log Activity",
}: {
  accounts: Account[];
  defaultAccountId?: string;
  defaultDealId?: string;
  defaultEventId?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
  buttonLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(defaultAccountId || "");

  const lockedClient = Boolean(defaultAccountId);
  const clientOptional = Boolean(defaultEventId) && !lockedClient;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const requiredFields = [{ name: "subject", label: "Subject" }];
    if (!lockedClient && !clientOptional) {
      requiredFields.push({ name: "account_id", label: "Client" });
    }
    const missing = validateRequired(formData, requiredFields);
    if (missing) {
      setError(missing);
      return;
    }

    setLoading(true);
    const result = await createActivity(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setAccountId(defaultAccountId || "");
    form.reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setAccountId(defaultAccountId || "");
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Plus className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          {defaultDealId && (
            <input type="hidden" name="deal_id" value={defaultDealId} />
          )}
          {defaultEventId && (
            <input type="hidden" name="event_id" value={defaultEventId} />
          )}
          {lockedClient ? (
            <input type="hidden" name="account_id" value={defaultAccountId} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="account_id">
                Client{clientOptional ? " (optional)" : ""}
              </Label>
              <SearchableClientSelect
                id="account_id"
                accounts={accounts}
                value={accountId}
                onChange={setAccountId}
                required={!clientOptional}
                className="max-w-none"
                placeholder="Type client name…"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <NativeSelect id="type" name="type" defaultValue="call">
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACTIVITY_TYPE_LABELS[t]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              name="subject"
              required
              placeholder="Follow-up call with GM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Details</Label>
            <Textarea id="body" name="body" placeholder="Discussion notes..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occurred_at">Date & time</Label>
            <Input
              id="occurred_at"
              name="occurred_at"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Log Activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
