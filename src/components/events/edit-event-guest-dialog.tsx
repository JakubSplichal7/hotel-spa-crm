"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateEventGuest } from "@/lib/actions/events";
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
import type { Account, Contact, EventGuest } from "@/lib/types";

export function EditEventGuestDialog({
  guest,
  eventId,
  accounts = [],
  contacts = [],
}: {
  guest: EventGuest;
  eventId: string;
  accounts?: Account[];
  contacts?: Contact[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(guest.account_id || "");
  const [contactId, setContactId] = useState("");
  const [name, setName] = useState(guest.name);
  const [email, setEmail] = useState(guest.email || "");
  const [phone, setPhone] = useState(guest.phone || "");
  const [notes, setNotes] = useState(guest.notes || "");

  const clientContacts = useMemo(() => {
    if (!accountId) return [];
    return contacts
      .filter((c) => c.account_id === accountId)
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [contacts, accountId]);

  function syncFromGuest() {
    setAccountId(guest.account_id || "");
    setContactId("");
    setName(guest.name);
    setEmail(guest.email || "");
    setPhone(guest.phone || "");
    setNotes(guest.notes || "");
    setError(null);
  }

  function handleAccountChange(nextId: string) {
    setAccountId(nextId);
    setContactId("");
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
    formData.set("notes", notes);
    const missing = validateRequired(formData, [
      { name: "name", label: "Name" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    setLoading(true);
    const result = await updateEventGuest(guest.id, eventId, formData);
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
        if (next) syncFromGuest();
      }}
    >
      <DialogTrigger asChild>
        <EditIconTrigger label={`Edit ${guest.name}`} />
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit guest</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          {accounts.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor={`guest-account-${guest.id}`}>
                Client (optional)
              </Label>
              <SearchableClientSelect
                id={`guest-account-${guest.id}`}
                accounts={accounts}
                value={accountId}
                onChange={handleAccountChange}
                className="max-w-none"
                placeholder="Link to a CRM client…"
              />
            </div>
          ) : null}
          {accountId ? (
            <div className="space-y-2">
              <Label htmlFor={`guest-contact-${guest.id}`}>
                Contact (optional)
              </Label>
              <NativeSelect
                id={`guest-contact-${guest.id}`}
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
                  This client has no contacts yet.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choosing a contact fills name, email, and phone.
                </p>
              )}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={`guest-name-${guest.id}`} required>
              Name
            </Label>
            <Input
              id={`guest-name-${guest.id}`}
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`guest-email-${guest.id}`}>Email</Label>
            <Input
              id={`guest-email-${guest.id}`}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`guest-phone-${guest.id}`}>Phone</Label>
            <Input
              id={`guest-phone-${guest.id}`}
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`guest-notes-${guest.id}`}>Notes</Label>
            <Textarea
              id={`guest-notes-${guest.id}`}
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Dietary needs…"
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
