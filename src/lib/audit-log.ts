import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LogAuditEventInput } from "@/lib/audit";

/** Append an immutable audit row. Never throws to callers. */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
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
