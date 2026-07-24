"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact pencil trigger matching row delete icon buttons */
export const EditIconTrigger = React.forwardRef<
  HTMLButtonElement,
  {
    label?: string;
    className?: string;
  } & React.ComponentPropsWithoutRef<typeof Button>
>(function EditIconTrigger(
  { label = "Edit", className, ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "h-9 w-9 p-0 text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      aria-label={label}
      {...props}
      title="Edit"
    >
      <Pencil className="h-4 w-4" />
    </Button>
  );
});
