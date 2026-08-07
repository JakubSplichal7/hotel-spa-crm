"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatDateTime, cn } from "@/lib/utils";
import { ArrowLeft, ScrollText } from "lucide-react";

const ACTION_OPTIONS = ["created", "updated", "deleted"] as const;

function actionBadgeVariant(action: string) {
  if (action === "created") return "success" as const;
  if (action === "deleted") return "destructive" as const;
  return "secondary" as const;
}

function subjectLabel(entityType: string) {
  const label = AUDIT_ENTITY_LABELS[entityType] || entityType;
  return label.toLowerCase();
}

function actorName(event: AuditEvent) {
  return (
    (event.actor as { full_name?: string } | null)?.full_name || "Unknown user"
  );
}

/** Local calendar date YYYY-MM-DD for an ISO timestamp. */
function localDateKey(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function TransactionDetail({ event }: { event: AuditEvent }) {
  return (
    <div className="rounded-lg border bg-card/80 p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{event.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {actorName(event)} · {formatDateTime(event.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant={actionBadgeVariant(event.action)}>
            {event.action}
          </Badge>
          <Badge variant="outline">
            {AUDIT_ENTITY_LABELS[event.entity_type] || event.entity_type}
          </Badge>
        </div>
      </div>
      {event.entity_label ? (
        <p className="mt-2 text-sm text-muted-foreground">{event.entity_label}</p>
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
                  <td className="px-2 py-1.5 font-medium">{change.field}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {change.from ?? "—"}
                  </td>
                  <td className="px-2 py-1.5">{change.to ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          No field-level changes recorded for this transaction.
        </p>
      )}
    </div>
  );
}

export function TransactionLogButton({
  accountId,
  entityType,
  entityTypes,
  entityId,
  includeRelated,
  title = "Transaction log",
  description,
  buttonVariant = "outline",
  buttonSize = "sm",
}: {
  accountId?: string | null;
  entityType?: AuditEntityType | string | null;
  entityTypes?: (AuditEntityType | string)[] | null;
  entityId?: string | null;
  includeRelated?: boolean;
  title?: string;
  description?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [author, setAuthor] = useState("all");
  const [action, setAction] = useState("all");
  const [subject, setSubject] = useState("all");

  useEffect(() => {
    if (!open) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSelected(null);
      setDateFrom("");
      setDateTo("");
      setAuthor("all");
      setAction("all");
      setSubject("all");
      const result = await getAuditEvents({
        accountId,
        entityType,
        entityTypes,
        entityId,
        includeRelated,
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
    includeRelated,
    entityTypes?.join(","),
  ]);

  const authorOptions = useMemo(() => {
    const names = new Set(events.map(actorName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const subjectOptions = useMemo(() => {
    const types = new Set(events.map((e) => e.entity_type));
    return Array.from(types).sort((a, b) =>
      subjectLabel(a).localeCompare(subjectLabel(b))
    );
  }, [events]);

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const day = localDateKey(event.created_at);
      if (dateFrom && day < dateFrom) return false;
      if (dateTo && day > dateTo) return false;
      if (author !== "all" && actorName(event) !== author) return false;
      if (action !== "all" && event.action !== action) return false;
      if (subject !== "all" && event.entity_type !== subject) return false;
      return true;
    });
  }, [events, dateFrom, dateTo, author, action, subject]);

  const filtersActive =
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    author !== "all" ||
    action !== "all" ||
    subject !== "all";

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setAuthor("all");
    setAction("all");
    setSubject("all");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant={buttonVariant} size={buttonSize}>
          <ScrollText className="mr-2 h-4 w-4" />
          Transaction log
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          {selected ? (
            <div className="flex items-start gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 mt-0.5 h-8 w-8 shrink-0 p-0"
                onClick={() => setSelected(null)}
                aria-label="Back to list"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <DialogTitle>Transaction detail</DialogTitle>
                <DialogDescription>
                  {selected.entity_label || selected.summary}
                </DialogDescription>
              </div>
            </div>
          ) : (
            <>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>
                {description ||
                  "Historical actions for this section. Newest first. Click a row for details."}
              </DialogDescription>
            </>
          )}
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {selected ? (
            <TransactionDetail event={selected} />
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !events.length ? (
            <p className="text-sm text-muted-foreground">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-nowrap items-end gap-2 overflow-x-auto pb-1">
                <label className="flex w-[140px] shrink-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  From
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9"
                  />
                </label>
                <label className="flex w-[140px] shrink-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  To
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9"
                  />
                </label>
                <label className="flex w-[160px] shrink-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Author
                  <NativeSelect
                    className="h-9"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  >
                    <option value="all">All authors</option>
                    {authorOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <label className="flex w-[130px] shrink-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Action
                  <NativeSelect
                    className="h-9"
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                  >
                    <option value="all">All actions</option>
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                <label className="flex w-[140px] shrink-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Subject
                  <NativeSelect
                    className="h-9"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="all">All subjects</option>
                    {subjectOptions.map((type) => (
                      <option key={type} value={type}>
                        {subjectLabel(type)}
                      </option>
                    ))}
                  </NativeSelect>
                </label>
                {filtersActive ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>

              {!filtered.length ? (
                <p className="text-sm text-muted-foreground">
                  No transactions match these filters.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Action</th>
                        <th className="px-3 py-2 font-medium">Subject</th>
                        <th className="px-3 py-2 font-medium">Time</th>
                        <th className="px-3 py-2 font-medium">By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((event) => (
                        <tr
                          key={event.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelected(event)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(event);
                            }
                          }}
                          className={cn(
                            "cursor-pointer border-b last:border-0",
                            "hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                          )}
                        >
                          <td className="max-w-[180px] truncate px-3 py-2 font-medium">
                            {event.entity_label || "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 capitalize text-muted-foreground">
                            {event.action}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                            {subjectLabel(event.entity_type)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                            {formatDateTime(event.created_at)}
                          </td>
                          <td className="max-w-[160px] truncate px-3 py-2 text-muted-foreground">
                            {actorName(event)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
