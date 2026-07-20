"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActivityType } from "@/lib/types";

export async function createActivity(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = (formData.get("account_id") as string) || null;
  const dealId = (formData.get("deal_id") as string) || null;
  const eventId = (formData.get("event_id") as string) || null;

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
      subject: formData.get("subject") as string,
      body: (formData.get("body") as string) || null,
      occurred_at: (formData.get("occurred_at") as string) || new Date().toISOString(),
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/activities");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { data };
}

export async function deleteActivity(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/activities");
  return { success: true };
}

export async function deleteActivities(ids: string[]) {
  await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { error } = await supabase.from("activities").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/activities");
  return { success: true };
}
