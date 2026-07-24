"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateContact } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/form-error";
import { EditIconTrigger } from "@/components/edit-icon-trigger";
import { validateRequired } from "@/lib/form-validation";
import type { Contact } from "@/lib/types";

export function EditContactDialog({
  contact,
  accountId,
  compact = false,
}: {
  contact: Contact;
  accountId: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const missing = validateRequired(formData, [
      { name: "name", label: "Name" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    setLoading(true);
    const result = await updateContact(contact.id, accountId, formData);
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
        if (next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        {compact ? (
          <EditIconTrigger label={`Edit ${contact.name}`} />
        ) : (
          <Button type="button" variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor={`contact-name-${contact.id}`} required>
              Name
            </Label>
            <Input
              id={`contact-name-${contact.id}`}
              name="name"
              required
              defaultValue={contact.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`contact-title-${contact.id}`}>Title</Label>
            <Input
              id={`contact-title-${contact.id}`}
              name="title"
              defaultValue={contact.title || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`contact-email-${contact.id}`}>Email</Label>
            <Input
              id={`contact-email-${contact.id}`}
              name="email"
              type="email"
              defaultValue={contact.email || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`contact-phone-${contact.id}`}>Phone</Label>
            <Input
              id={`contact-phone-${contact.id}`}
              name="phone"
              defaultValue={contact.phone || ""}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`contact-primary-${contact.id}`}
              name="is_primary"
              className="rounded"
              defaultChecked={contact.is_primary}
            />
            <Label htmlFor={`contact-primary-${contact.id}`}>
              Primary contact
            </Label>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
