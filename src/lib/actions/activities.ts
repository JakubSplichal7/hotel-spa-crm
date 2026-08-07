"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { buildAuditChanges, logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { ActivityType } from "@/lib/types";

const ACTIVITY_AUDIT_FIELDS = [
  { key: "type", label: "Type" },
  { key: "subject", label: "Subject" },
  { key: "body", label: "Details" },
  { key: "occurred_at", label: "When" },
  { key: "account_id", label: "Client" },
  { key: "deal_id", label: "Offer" },
  { key: "event_id", label: "Event" },
];

export async function createActivity(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = (formData.get("account_id") as string) || null;
  const dealId = (formData.get("deal_id") as string) || null;
  const eventId = (formData.get("event_id") as string) || null;
  const subject = formData.get("subject") as string;

  if (!accountId && !eventId) {
    return { error: "Select a client, or log this activity from an event." };
  }

  const { data, error } = await supabase
    .from("activities")
    .insert({
      org_id: profile.org_id,
      account_id: accountId,
      deal_id: dealId,
      event_id: eventId,
      type: formData.get("type") as ActivityType,
      subject,
      body: (formData.get("body") as string) || null,
      occurred_at: (formData.get("occurred_at") as string) || new Date().toISOString(),
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "activity",
    entityId: data.id,
    entityLabel: subject,
    accountId,
    summary: `Logged activity “${subject}”`,
  });

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { data };
}

export async function updateActivity(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = (formData.get("account_id") as string) || null;
  const dealId = (formData.get("deal_id") as string) || null;
  const eventId = (formData.get("event_id") as string) || null;
  const subject = formData.get("subject") as string;

  if (!accountId && !eventId) {
    return { error: "Select a client, or keep this activity linked to an event." };
  }

  const { data: before } = await supabase
    .from("activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const next = {
    account_id: accountId,
    deal_id: dealId,
    event_id: eventId,
    type: formData.get("type") as ActivityType,
    subject,
    body: (formData.get("body") as string) || null,
    occurred_at:
      (formData.get("occurred_at") as string) || new Date().toISOString(),
  };

  const { error } = await supabase
    .from("activities")
    .update(next)
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "activity",
    entityId: id,
    entityLabel: subject,
    accountId: accountId || before?.account_id || null,
    summary: `Updated activity “${subject}”`,
    changes: buildAuditChanges(before, next, ACTIVITY_AUDIT_FIELDS),
  });

  revalidatePath("/activities");
  revalidatePath(`/activities/${id}`);
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function deleteActivity(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("activities")
    .select("subject, account_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "activity",
    entityId: id,
    entityLabel: before?.subject || id,
    accountId: before?.account_id || null,
    summary: `Deleted activity “${before?.subject || id}”`,
  });

  revalidatePath("/activities");
  return { success: true };
}

export async function deleteActivities(ids: string[]) {
  const profile = await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("activities")
    .select("id, subject, account_id")
    .in("id", ids);

  const { error } = await supabase.from("activities").delete().in("id", ids);
  if (error) return { error: error.message };

  for (const row of before || []) {
    await logAuditEvent({
      profile,
      action: "deleted",
      entityType: "activity",
      entityId: row.id,
      entityLabel: row.subject,
      accountId: row.account_id,
      summary: `Deleted activity “${row.subject}”`,
    });
  }

  revalidatePath("/activities");
  return { success: true };
}
