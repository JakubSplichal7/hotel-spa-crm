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
import type { Idea } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

export function EditIdeaDialog({ idea }: { idea: Idea }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
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
    <Dialog open={open} onOpenChange={setOpen}>
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
        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor={`name-${idea.id}`}>Name</Label>
            <Input
              id={`name-${idea.id}`}
              name="name"
              required
              defaultValue={idea.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`note-${idea.id}`}>Note</Label>
            <Textarea
              id={`note-${idea.id}`}
              name="note"
              defaultValue={idea.note || ""}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`contact-${idea.id}`}>Contact</Label>
            <Input
              id={`contact-${idea.id}`}
              name="contact"
              defaultValue={idea.contact || ""}
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
