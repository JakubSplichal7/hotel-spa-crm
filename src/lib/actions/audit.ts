"use server";

import { createClient } from "@/lib/supabase/server";
import { canManageAll, requireProfile } from "@/lib/auth";
import type { AuditEntityType, AuditEvent } from "@/lib/audit";

export async function getAuditEvents(filters?: {
  accountId?: string | null;
  entityType?: AuditEntityType | string | null;
  entityTypes?: (AuditEntityType | string)[] | null;
  entityId?: string | null;
  /** When true with entityId, also match related_entity_id (child rows). */
  includeRelated?: boolean;
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
    if (filters.includeRelated) {
      query = query.or(
        `entity_id.eq.${filters.entityId},related_entity_id.eq.${filters.entityId}`
      );
    } else {
      query = query.eq("entity_id", filters.entityId);
    }
  }

  const { data, error } = await query;
  if (error) {
    // Fall back if related_entity_id column is not migrated yet
    if (
      filters?.entityId &&
      filters.includeRelated &&
      /related_entity_id/i.test(error.message)
    ) {
      let fallback = supabase
        .from("audit_events")
        .select("*, actor:profiles!audit_events_actor_id_fkey(full_name)")
        .eq("org_id", profile.org_id)
        .eq("entity_id", filters.entityId)
        .order("created_at", { ascending: false })
        .limit(filters?.limit ?? 200);
      if (filters?.accountId) {
        fallback = fallback.eq("account_id", filters.accountId);
      }
      if (filters?.entityTypes?.length) {
        fallback = fallback.in("entity_type", filters.entityTypes);
      } else if (filters?.entityType) {
        fallback = fallback.eq("entity_type", filters.entityType);
      }
      const retry = await fallback;
      if (retry.error) return { error: retry.error.message };
      return { data: (retry.data || []) as AuditEvent[] };
    }
    return { error: error.message };
  }
  return { data: (data || []) as AuditEvent[] };
}
