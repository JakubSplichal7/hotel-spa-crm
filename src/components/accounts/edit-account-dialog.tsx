"use client";

import { useState } from "react";
import { updateAccount } from "@/lib/actions/accounts";
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
import {
  ACCOUNT_TYPES,
  ACCOUNT_STATUSES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
  ACQUISITION_SOURCES,
  ACQUISITION_SOURCE_LABELS,
} from "@/lib/types";
import type { Account, Profile } from "@/lib/types";
import { Pencil } from "lucide-react";

export function EditAccountDialog({
  account,
  profiles,
}: {
  account: Account;
  profiles: Profile[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateAccount(account.id, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  }

  const typeValue =
    account.type === "company" || account.type === "individual"
      ? account.type
      : "company";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Client name</Label>
            <Input id="name" name="name" required defaultValue={account.name} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Client type</Label>
              <NativeSelect id="type" name="type" defaultValue={typeValue}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <NativeSelect id="status" name="status" defaultValue={account.status}>
                {ACCOUNT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ACCOUNT_STATUS_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <LocationFields
            defaultCountry={account.country}
            defaultCity={account.city}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="loyalty_tier">Acquisition</Label>
              <NativeSelect
                id="loyalty_tier"
                name="loyalty_tier"
                defaultValue={
                  ACQUISITION_SOURCES.includes(
                    account.loyalty_tier as (typeof ACQUISITION_SOURCES)[number]
                  )
                    ? (account.loyalty_tier as string)
                    : "jana_splichalova"
                }
              >
                {ACQUISITION_SOURCES.map((t) => (
                  <option key={t} value={t}>
                    {ACQUISITION_SOURCE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                id="is_vip"
                name="is_vip"
                className="rounded"
                defaultChecked={Boolean(account.is_vip)}
              />
              <Label htmlFor="is_vip">VIP client</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner_id">Account manager</Label>
            <NativeSelect id="owner_id" name="owner_id" defaultValue={account.owner_id}>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferences">Preferences</Label>
            <Textarea
              id="preferences"
              name="preferences"
              defaultValue={account.preferences || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" name="notes" defaultValue={account.notes || ""} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
