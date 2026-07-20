"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";
import { ConfirmYesNoDialog } from "@/components/deals/confirm-yes-no-dialog";
import { Trash2 } from "lucide-react";

export function DeleteAccountButton({
  accountId,
  accountName,
}: {
  accountId: string;
  accountName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleYes() {
    setLoading(true);
    setError(null);
    const result = await deleteAccount(accountId);
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
        aria-label={`Delete ${accountName}`}
        onClick={() => {
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
        title="Delete client?"
        description={
          error
            ? error
            : `Delete “${accountName}”? This cannot be undone and may also remove related contacts and linked data.`
        }
        yesLabel="Delete"
        noLabel="Cancel"
        loading={loading}
        onYes={handleYes}
        onNo={() => setOpen(false)}
      />
    </>
  );
}
