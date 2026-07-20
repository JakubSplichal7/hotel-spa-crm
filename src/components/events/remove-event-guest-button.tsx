"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEventGuest } from "@/lib/actions/events";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function RemoveEventGuestButton({
  guestId,
  eventId,
}: {
  guestId: string;
  eventId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    await deleteEventGuest(guestId, eventId);
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleRemove}
      aria-label="Remove guest"
    >
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
