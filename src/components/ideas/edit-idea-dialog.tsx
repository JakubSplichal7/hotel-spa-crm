"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateIdea, deleteIdea } from "@/lib/actions/ideas";
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
import type { Idea } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

export function EditIdeaDialog({ idea }: { idea: Idea }) {
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
    const result = await updateIdea(idea.id, formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this idea?")) return;
    setLoading(true);
    await deleteIdea(idea.id);
    setLoading(false);
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
        <Button type="button" variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor={`name-${idea.id}`} required>
              Name
            </Label>
            <Input
              id={`name-${idea.id}`}
              name="name"
              required
              defaultValue={idea.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${idea.id}`}>Description</Label>
            <Textarea
              id={`description-${idea.id}`}
              name="description"
              defaultValue={idea.note || ""}
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={handleDelete}
              aria-label="Delete idea"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
