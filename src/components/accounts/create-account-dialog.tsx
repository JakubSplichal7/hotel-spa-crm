"use client";

import { useState } from "react";
import { createAccount } from "@/lib/actions/accounts";
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
import { LocationFields } from "@/components/accounts/location-fields";
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";
import {
  ACCOUNT_TYPES,
  ACCOUNT_STATUSES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
  ACQUISITION_SOURCES,
  ACQUISITION_SOURCE_LABELS,
} from "@/lib/types";
import type { Profile } from "@/lib/types";
import { Plus } from "lucide-react";

export function CreateAccountDialog({ profiles }: { profiles: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const missing = validateRequired(formData, [
      { name: "name", label: "Client name" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    setLoading(true);
    const result = await createAccount(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Client name
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Acme Corp or Jane Smith"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Client type</Label>
              <NativeSelect id="type" name="type" defaultValue="company">
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <NativeSelect id="status" name="status" defaultValue="prospect">
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ACCOUNT_STATUS_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <LocationFields />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loyalty_tier">Acquisition</Label>
              <NativeSelect
                id="loyalty_tier"
                name="loyalty_tier"
                defaultValue="jana_splichalova"
              >
                {ACQUISITION_SOURCES.map((t) => (
                  <option key={t} value={t}>
                    {ACQUISITION_SOURCE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input type="checkbox" id="is_vip" name="is_vip" className="rounded" />
              <Label htmlFor="is_vip">VIP client</Label>
            </div>
          </div>
          {profiles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="owner_id">Account manager</Label>
              <NativeSelect id="owner_id" name="owner_id" defaultValue={profiles[0]?.id}>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="preferences">Preferences</Label>
            <Textarea
              id="preferences"
              name="preferences"
              placeholder="Room type, spa interests, dietary needs, preferred contact time..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" name="notes" placeholder="Anything the team should know..." />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
