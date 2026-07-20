"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { FormError } from "@/components/form-error";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { validateRequired } from "@/lib/form-validation";
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
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dupWarning, setDupWarning] = useState<{
    ico: string;
    existingNames: string[];
  } | null>(null);

  async function submitForm(allowDuplicate: boolean) {
    const form = formRef.current;
    if (!form) return;

    setError(null);
    const formData = new FormData(form);
    const missing = validateRequired(formData, [
      { name: "nickname", label: "Client" },
      { name: "name", label: "Official name" },
      { name: "ico", label: "IČO" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }

    if (allowDuplicate) {
      formData.set("allow_duplicate_ico", "1");
    }

    setLoading(true);
    const result = await updateAccount(account.id, formData);
    setLoading(false);

    if (result && "duplicate" in result && result.duplicate) {
      setDupWarning({
        ico: result.ico,
        existingNames: result.existingNames,
      });
      return;
    }

    if (result?.error) {
      setError(result.error);
      return;
    }

    setDupWarning(null);
    setOpen(false);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submitForm(false);
  }

  const typeValue =
    account.type === "company" || account.type === "individual"
      ? account.type
      : "company";

  const dupNames = dupWarning?.existingNames.join(", ") || "";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setError(null);
            setDupWarning(null);
          }
        }}
      >
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
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            <FormError message={error} />
            <div className="space-y-2">
              <Label htmlFor="nickname" required>
                Client
              </Label>
              <Input
                id="nickname"
                name="nickname"
                required
                defaultValue={account.nickname || ""}
                placeholder="Short name used in the CRM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Official name
              </Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={account.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ico" required>
                IČO
              </Label>
              <Input
                id="ico"
                name="ico"
                required
                inputMode="numeric"
                defaultValue={account.ico || ""}
                placeholder="12345678"
                autoComplete="off"
              />
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
                <NativeSelect
                  id="status"
                  name="status"
                  defaultValue={account.status}
                >
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
              <NativeSelect
                id="owner_id"
                name="owner_id"
                defaultValue={account.owner_id}
              >
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
              <Textarea
                id="notes"
                name="notes"
                defaultValue={account.notes || ""}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmYesNoDialog
        open={!!dupWarning}
        onOpenChange={(next) => {
          if (!next) setDupWarning(null);
        }}
        title="Duplicate IČO"
        description={
          dupWarning
            ? `A client with IČO ${dupWarning.ico} already exists (${dupNames}). Do you still want to save this change?`
            : ""
        }
        yesLabel="Save anyway"
        noLabel="Cancel"
        loading={loading}
        onYes={async () => {
          await submitForm(true);
        }}
        onNo={() => setDupWarning(null)}
      />
    </>
  );
}
