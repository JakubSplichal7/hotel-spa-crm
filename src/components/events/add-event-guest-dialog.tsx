"use client";

import { useMemo, useState } from "react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { SearchableClientSelect } from "@/components/searchable-client-select";
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";
import {
  getAccountDisplayName,
  type Account,
  type Contact,
} from "@/lib/types";
import { Plus } from "lucide-react";

export function AddEventGuestDialog({
  eventId,
  accounts = [],
  contacts = [],
  buttonVariant = "default",
  buttonSize = "sm",
}: {
  eventId: string;
  accounts?: Account[];
  contacts?: Contact[];
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState("");
  const [contactId, setContactId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const clientContacts = useMemo(() => {
    if (!accountId) return [];
    return contacts
      .filter((c) => c.account_id === accountId)
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [contacts, accountId]);

  function resetForm() {
    setAccountId("");
    setContactId("");
    setName("");
    setEmail("");
    setPhone("");
    setError(null);
  }

  function handleAccountChange(nextId: string) {
    setAccountId(nextId);
    setContactId("");
    if (!nextId) return;
    const account = accounts.find((a) => a.id === nextId);
    if (account) {
      setName(getAccountDisplayName(account));
    }
  }

  function handleContactChange(nextId: string) {
    setContactId(nextId);
    if (!nextId) return;
    const contact = clientContacts.find((c) => c.id === nextId);
    if (!contact) return;
    setName(contact.name);
    setEmail(contact.email || "");
    setPhone(contact.phone || "");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("account_id", accountId);
    formData.set("name", name);
    formData.set("email", email);
    formData.set("phone", phone);
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
    resetForm();
    form.reset();
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Plus className="mr-2 h-4 w-4" />
          Add guest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
          {accountId ? (
            <div className="space-y-2">
              <Label htmlFor="contact_id">Contact (optional)</Label>
              <NativeSelect
                id="contact_id"
                value={contactId}
                onChange={(e) => handleContactChange(e.target.value)}
              >
                <option value="">Select a contact…</option>
                {clientContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.is_primary ? " (Primary)" : ""}
                    {c.title ? ` · ${c.title}` : ""}
                  </option>
                ))}
              </NativeSelect>
              {clientContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  This client has no contacts yet. You can still enter details
                  manually.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choosing a contact fills name, email, and phone.
                </p>
              )}
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
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="optional"
            />
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
