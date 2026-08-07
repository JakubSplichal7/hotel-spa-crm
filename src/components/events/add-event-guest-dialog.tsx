"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createEventGuest } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
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
import type { Account, Contact } from "@/lib/types";
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
  const [notes, setNotes] = useState("");

  const clientContacts = useMemo(() => {
    if (!accountId) return [];
    return contacts
      .filter((c) => c.account_id === accountId)
      .sort((a, b) => {
        if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [contacts, accountId]);

  const selectedAccount = accounts.find((a) => a.id === accountId) || null;
  const selectedContact =
    clientContacts.find((c) => c.id === contactId) || null;

  function resetForm() {
    setAccountId("");
    setContactId("");
    setNotes("");
    setError(null);
  }

  function handleAccountChange(nextId: string) {
    setAccountId(nextId);
    setContactId("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("account_id", accountId);
    formData.set("contact_id", contactId);
    formData.set("notes", notes);
    const missing = validateRequired(formData, [
      { name: "account_id", label: "Name" },
      { name: "contact_id", label: "Contact name" },
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
          Add client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add client to event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="account_id" required>
              Name
            </Label>
            <SearchableClientSelect
              id="account_id"
              accounts={accounts}
              value={accountId}
              onChange={handleAccountChange}
              required
              className="max-w-none"
              placeholder="Select client…"
            />
          </div>
          {selectedAccount ? (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground">Official name</p>
              <p className="font-medium">{selectedAccount.name || "—"}</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="contact_id" required>
              Contact name
            </Label>
            <NativeSelect
              id="contact_id"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
              disabled={!accountId}
            >
              <option value="">
                {accountId ? "Select a contact…" : "Select a client first"}
              </option>
              {clientContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_primary ? " (Primary)" : ""}
                  {c.title ? ` · ${c.title}` : ""}
                </option>
              ))}
            </NativeSelect>
            {accountId && clientContacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                This client has no contacts. Add a contact on the client page
                first.
              </p>
            ) : null}
          </div>
          {selectedContact ? (
            <div className="grid gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{selectedContact.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{selectedContact.phone || "—"}</p>
              </div>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note…"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add client"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
