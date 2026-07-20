"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { Trash2 } from "lucide-react";

type DeleteResult = { error?: string; success?: boolean };

export function DeleteRowButton({
  id,
  name,
  entityLabel,
  onDelete,
  extraWarning,
}: {
  id: string;
  name: string;
  /** Short label used in dialog, e.g. "offer", "event" */
  entityLabel: string;
  onDelete: (id: string) => Promise<DeleteResult>;
  extraWarning?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = `Delete ${entityLabel}?`;
  const defaultDescription = extraWarning
    ? `Delete “${name}”? ${extraWarning}`
    : `Delete “${name}”? This cannot be undone.`;

  async function handleYes() {
    setLoading(true);
    setError(null);
    const result = await onDelete(id);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label={`Delete ${name}`}
        onClick={(e) => {
          e.stopPropagation();
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmYesNoDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        title={title}
        description={error ? error : defaultDescription}
        yesLabel="Delete"
        noLabel="Cancel"
        loading={loading}
        onYes={handleYes}
        onNo={() => setOpen(false)}
      />
    </>
  );
}
