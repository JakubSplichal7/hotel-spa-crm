import type { Profile } from "@/lib/types";

export type AuditAction = "created" | "updated" | "deleted";

export type AuditEntityType =
  | "account"
  | "contact"
  | "account_note"
  | "deal"
  | "task"
  | "activity"
  | "booking"
  | "event"
  | "event_guest"
  | "idea";

export type AuditChange = {
  field: string;
  from: string | null;
  to: string | null;
};

export type AuditEvent = {
  id: string;
  org_id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: AuditEntityType | string;
  entity_id: string | null;
  entity_label: string | null;
  account_id: string | null;
  related_entity_id?: string | null;
  summary: string;
  changes: AuditChange[] | null;
  created_at: string;
  actor?: { full_name: string } | null;
};

function stringifyValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Build a list of changed fields between before/after snapshots. */
export function buildAuditChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  fields: { key: string; label: string }[]
): AuditChange[] {
  if (!before && !after) return [];
  const changes: AuditChange[] = [];
  for (const { key, label } of fields) {
    const from = stringifyValue(before?.[key]);
    const to = stringifyValue(after?.[key]);
    if (from === to) continue;
    changes.push({ field: label, from, to });
  }
  return changes;
}

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  account: "Client",
  contact: "Contact",
  account_note: "Note",
  deal: "Offer",
  task: "Task",
  activity: "Activity",
  booking: "Booking",
  event: "Event",
  event_guest: "Event client",
  idea: "Idea",
};

/** Input shape for server-side audit writes (see logAuditEvent). */
export type LogAuditEventInput = {
  profile: Profile;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  accountId?: string | null;
  /** Parent entity (e.g. event id for an event_guest row). */
  relatedEntityId?: string | null;
  summary: string;
  changes?: AuditChange[] | null;
};
