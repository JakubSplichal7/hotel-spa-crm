"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIdea } from "@/lib/actions/ideas";
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

export function CreateIdeaDialog() {
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
    const result = await createIdea(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    form.reset();
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Idea
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormError message={error} />
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Name
            </Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Idea title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the idea…"
              rows={4}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save idea"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
