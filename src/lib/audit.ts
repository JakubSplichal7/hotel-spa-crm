import { createClient } from "@/lib/supabase/server";
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

export async function logAuditEvent(input: {
  profile: Profile;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  accountId?: string | null;
  summary: string;
  changes?: AuditChange[] | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_events").insert({
      org_id: input.profile.org_id,
      actor_id: input.profile.id,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId || null,
      entity_label: input.entityLabel || null,
      account_id: input.accountId || null,
      summary: input.summary,
      changes:
        input.changes && input.changes.length > 0 ? input.changes : null,
    });
    if (error) {
      console.error("audit log failed:", error.message);
    }
  } catch (err) {
    console.error("audit log failed:", err);
  }
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
