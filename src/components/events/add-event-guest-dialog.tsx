"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEventGuest } from "@/lib/actions/events";
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
import { SearchableClientSelect } from "@/components/searchable-client-select";
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";
import { getAccountDisplayName, type Account } from "@/lib/types";
import { Plus } from "lucide-react";

export function AddEventGuestDialog({
  eventId,
  accounts = [],
  buttonVariant = "default",
  buttonSize = "sm",
}: {
  eventId: string;
  accounts?: Account[];
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("");

  function handleAccountChange(nextId: string) {
    setAccountId(nextId);
    if (!nextId) return;
    const account = accounts.find((a) => a.id === nextId);
    if (account && !name.trim()) {
      setName(getAccountDisplayName(account));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("account_id", accountId);
    formData.set("name", name);
    const missing = validateRequired(formData, [
      { name: "name", label: "Name" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    setLoading(true);
    const result = await createEventGuest(eventId, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setAccountId("");
    setName("");
    form.reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setError(null);
          setAccountId("");
          setName("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Plus className="mr-2 h-4 w-4" />
          Add guest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite guest</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          {accounts.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="account_id">Client (optional)</Label>
              <SearchableClientSelect
                id="account_id"
                accounts={accounts}
                value={accountId}
                onChange={handleAccountChange}
                className="max-w-none"
                placeholder="Link to a CRM client…"
              />
              <p className="text-xs text-muted-foreground">
                Link a client so this event shows on their profile.
              </p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" placeholder="optional" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Dietary needs…" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add guest"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
