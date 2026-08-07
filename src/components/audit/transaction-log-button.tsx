"use client";

import { useEffect, useState } from "react";
import { getAuditEvents } from "@/lib/actions/audit";
import {
  AUDIT_ENTITY_LABELS,
  type AuditEntityType,
  type AuditEvent,
} from "@/lib/audit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { ScrollText } from "lucide-react";

function actionBadgeVariant(action: string) {
  if (action === "created") return "success" as const;
  if (action === "deleted") return "destructive" as const;
  return "secondary" as const;
}

export function TransactionLogButton({
  accountId,
  entityType,
  entityTypes,
  entityId,
  title = "Transaction log",
  description,
  buttonVariant = "outline",
  buttonSize = "sm",
}: {
  accountId?: string | null;
  entityType?: AuditEntityType | string | null;
  entityTypes?: (AuditEntityType | string)[] | null;
  entityId?: string | null;
  title?: string;
  description?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getAuditEvents({
        accountId,
        entityType,
        entityTypes,
        entityId,
        limit: 200,
      });
      if (cancelled) return;
      setLoading(false);
      if (result.error) {
        setError(result.error);
        setEvents([]);
        return;
      }
      setEvents(result.data || []);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    open,
    accountId,
    entityType,
    entityId,
    // Stabilize array prop for effect deps
    entityTypes?.join(","),
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={buttonVariant} size={buttonSize}>
          <ScrollText className="mr-2 h-4 w-4" />
          Transaction log
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ||
              "Historical actions for this section. Newest first."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !events.length ? (
            <p className="text-sm text-muted-foreground">
              No transactions recorded yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="rounded-lg border bg-card/80 p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{event.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(event.actor as { full_name?: string } | null)
                          ?.full_name || "Unknown user"}{" "}
                        · {formatDateTime(event.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={actionBadgeVariant(event.action)}>
                        {event.action}
                      </Badge>
                      <Badge variant="outline">
                        {AUDIT_ENTITY_LABELS[event.entity_type] ||
                          event.entity_type}
                      </Badge>
                    </div>
                  </div>
                  {event.entity_label ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {event.entity_label}
                    </p>
                  ) : null}
                  {event.changes && event.changes.length > 0 ? (
                    <div className="mt-3 overflow-x-auto rounded-md border bg-muted/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="px-2 py-1.5 font-medium">Field</th>
                            <th className="px-2 py-1.5 font-medium">From</th>
                            <th className="px-2 py-1.5 font-medium">To</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.changes.map((change, idx) => (
                            <tr
                              key={`${event.id}-${change.field}-${idx}`}
                              className="border-b last:border-0"
                            >
                              <td className="px-2 py-1.5 font-medium">
                                {change.field}
                              </td>
                              <td className="px-2 py-1.5 text-muted-foreground">
                                {change.from ?? "—"}
                              </td>
                              <td className="px-2 py-1.5">{change.to ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
