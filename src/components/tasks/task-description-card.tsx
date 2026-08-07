"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskDescription } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/components/form-error";

export function TaskDescriptionCard({
  taskId,
  description,
}: {
  taskId: string;
  description: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(description || "");
    setSaved(false);
    setError(null);
  }, [taskId, description]);

  const dirty = value !== (description || "");

  async function handleSave() {
    setError(null);
    setSaved(false);
    setLoading(true);
    const result = await updateTaskDescription(taskId, value);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="task-description">Description</Label>
          {saved && !dirty ? (
            <span className="text-xs text-muted-foreground">Saved</span>
          ) : null}
        </div>
        <FormError message={error} />
        <Textarea
          id="task-description"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaved(false);
          }}
          rows={6}
          placeholder="Add more detail about this task…"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={loading || !dirty}
            onClick={handleSave}
          >
            {loading ? "Saving..." : "Save description"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
