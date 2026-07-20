"use client";

export function DeleteLinkedBookingsCheckbox({
  checked,
  onCheckedChange,
  id = "delete-linked-bookings",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-input"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span>
        <span className="font-medium">Also delete linked bookings</span>
        <span className="mt-0.5 block text-muted-foreground">
          If unchecked, bookings stay and are unlinked from the offer.
        </span>
      </span>
    </label>
  );
}
