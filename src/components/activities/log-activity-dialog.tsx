"use client";

import { useState } from "react";
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
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import type { Account } from "@/lib/types";
import { Plus } from "lucide-react";

export function LogActivityDialog({ accounts }: { accounts: Account[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const result = await createActivity(formData);
    setLoading(false);
    if (!result?.error) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Log Activity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Activity</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account_id">Client</Label>
            <NativeSelect id="account_id" name="account_id" required defaultValue="">
              <option value="" disabled>Select client</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <NativeSelect id="type" name="type" defaultValue="call">
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required placeholder="Follow-up call with GM" />
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
