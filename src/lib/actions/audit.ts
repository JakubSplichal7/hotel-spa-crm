"use server";

import { createClient } from "@/lib/supabase/server";
import { canManageAll, requireProfile } from "@/lib/auth";
import type { AuditEntityType, AuditEvent } from "@/lib/audit";

export async function getAuditEvents(filters?: {
  accountId?: string | null;
  entityType?: AuditEntityType | string | null;
  entityTypes?: (AuditEntityType | string)[] | null;
  entityId?: string | null;
  limit?: number;
}): Promise<{ data?: AuditEvent[]; error?: string }> {
  const profile = await requireProfile();
  if (!canManageAll(profile)) {
    return { error: "Only admins and managers can view the transaction log." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("audit_events")
    .select("*, actor:profiles!audit_events_actor_id_fkey(full_name)")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 200);

  if (filters?.accountId) {
    query = query.eq("account_id", filters.accountId);
  }
  if (filters?.entityTypes?.length) {
    query = query.in("entity_type", filters.entityTypes);
  } else if (filters?.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }
  if (filters?.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { data: (data || []) as AuditEvent[] };
}
