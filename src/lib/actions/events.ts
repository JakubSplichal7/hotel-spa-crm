"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function revalidateEventPaths(eventId: string, accountId?: string | null) {
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  if (accountId) revalidatePath(`/accounts/${accountId}`);
}

export async function createEvent(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const eventDate = String(formData.get("event_date") || "").trim();

  if (!name || !eventDate) {
    return { error: "Name and date are required." };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      org_id: profile.org_id,
      name,
      event_date: eventDate,
      notes: (formData.get("notes") as string) || null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/events");
  return { data };
}

export async function updateEvent(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const eventDate = String(formData.get("event_date") || "").trim();

  if (!name || !eventDate) {
    return { error: "Name and date are required." };
  }

  const { error } = await supabase
    .from("events")
    .update({
      name,
      event_date: eventDate,
      notes: (formData.get("notes") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await revalidateEventPaths(id);
  return { success: true };
}

export async function deleteEvent(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/events");
  return { success: true };
}

export async function deleteEvents(ids: string[]) {
  await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { error } = await supabase.from("events").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/events");
  return { success: true };
}

export async function createEventGuest(eventId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = String(formData.get("account_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  if (!accountId) return { error: "Client is required." };
  if (!contactId) return { error: "Contact is required." };

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, account_id, name, email, phone")
    .eq("id", contactId)
    .eq("account_id", accountId)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (contactError) return { error: contactError.message };
  if (!contact) return { error: "Selected contact was not found for this client." };

  const { data, error } = await supabase
    .from("event_guests")
    .insert({
      org_id: profile.org_id,
      event_id: eventId,
      account_id: accountId,
      contact_id: contact.id,
      name: contact.name,
      email: contact.email || null,
      phone: contact.phone || null,
      notes: String(formData.get("notes") || "").trim() || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await revalidateEventPaths(eventId, accountId);
  return { data };
}

export async function updateEventGuest(
  id: string,
  eventId: string,
  formData: FormData
) {
  await requireProfile();
  const supabase = await createClient();

  const accountId = String(formData.get("account_id") || "").trim();
  const contactId = String(formData.get("contact_id") || "").trim();
  if (!accountId) return { error: "Client is required." };
  if (!contactId) return { error: "Contact is required." };

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, account_id, name, email, phone")
    .eq("id", contactId)
    .eq("account_id", accountId)
    .eq("org_id", profile.org_id)
    .maybeSingle();

  if (contactError) return { error: contactError.message };
  if (!contact) return { error: "Selected contact was not found for this client." };

  const { data: existing } = await supabase
    .from("event_guests")
    .select("account_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("event_guests")
    .update({
      account_id: accountId,
      contact_id: contact.id,
      name: contact.name,
      email: contact.email || null,
      phone: contact.phone || null,
      notes: String(formData.get("notes") || "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await revalidateEventPaths(eventId, accountId);
  if (existing?.account_id && existing.account_id !== accountId) {
    revalidatePath(`/accounts/${existing.account_id}`);
  }
  return { success: true };
}

export async function deleteEventGuest(id: string, eventId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data: guest } = await supabase
    .from("event_guests")
    .select("account_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("event_guests").delete().eq("id", id);
  if (error) return { error: error.message };

  await revalidateEventPaths(eventId, guest?.account_id);
  return { success: true };
}
