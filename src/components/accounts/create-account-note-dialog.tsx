"use client";

import { useState } from "react";
import { createAccountNote } from "@/lib/actions/accounts";
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
import { FormError } from "@/components/form-error";
import { validateRequired } from "@/lib/form-validation";
import { Plus } from "lucide-react";

export function CreateAccountNoteDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const missing = validateRequired(formData, [
      { name: "body", label: "Note" },
    ]);
    if (missing) {
      setError(missing);
      return;
    }
    formData.set("account_id", accountId);
    setLoading(true);
    const result = await createAccountNote(formData);
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
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Optional short label" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body" required>
              Note
            </Label>
            <Textarea
              id="body"
              name="body"
              required
              rows={5}
              placeholder="Anything the team should know..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Note"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
