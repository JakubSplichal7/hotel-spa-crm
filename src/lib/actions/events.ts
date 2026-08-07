"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { buildAuditChanges } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-log";
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

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "event",
    entityId: data.id,
    entityLabel: name,
    summary: `Created event “${name}”`,
  });

  revalidatePath("/events");
  return { data };
}

export async function updateEvent(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const eventDate = String(formData.get("event_date") || "").trim();

  if (!name || !eventDate) {
    return { error: "Name and date are required." };
  }

  const { data: before } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const next = {
    name,
    event_date: eventDate,
    notes: (formData.get("notes") as string) || null,
  };

  const { error } = await supabase
    .from("events")
    .update({
      ...next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "event",
    entityId: id,
    entityLabel: name,
    summary: `Updated event “${name}”`,
    changes: buildAuditChanges(before, next, [
      { key: "name", label: "Name" },
      { key: "event_date", label: "Date" },
      { key: "notes", label: "Notes" },
    ]),
  });

  await revalidateEventPaths(id);
  return { success: true };
}

export async function deleteEvent(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("events")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "event",
    entityId: id,
    entityLabel: before?.name || id,
    summary: `Deleted event “${before?.name || id}”`,
  });

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

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "event_guest",
    entityId: data.id,
    entityLabel: contact.name,
    accountId,
    summary: `Added client contact “${contact.name}” to event`,
  });

  await revalidateEventPaths(eventId, accountId);
  return { data };
}

export async function updateEventGuest(
  id: string,
  eventId: string,
  formData: FormData
) {
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

  const { data: existing } = await supabase
    .from("event_guests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const next = {
    account_id: accountId,
    contact_id: contact.id,
    name: contact.name,
    email: contact.email || null,
    phone: contact.phone || null,
    notes: String(formData.get("notes") || "").trim() || null,
  };

  const { error } = await supabase
    .from("event_guests")
    .update(next)
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "event_guest",
    entityId: id,
    entityLabel: contact.name,
    accountId,
    summary: `Updated invited client contact “${contact.name}”`,
    changes: buildAuditChanges(existing, next, [
      { key: "account_id", label: "Client" },
      { key: "contact_id", label: "Contact" },
      { key: "name", label: "Contact name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "notes", label: "Note" },
    ]),
  });

  await revalidateEventPaths(eventId, accountId);
  if (existing?.account_id && existing.account_id !== accountId) {
    revalidatePath(`/accounts/${existing.account_id}`);
  }
  return { success: true };
}

export async function deleteEventGuest(id: string, eventId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: guest } = await supabase
    .from("event_guests")
    .select("account_id, name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("event_guests").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "event_guest",
    entityId: id,
    entityLabel: guest?.name || id,
    accountId: guest?.account_id || null,
    summary: `Removed invited client contact “${guest?.name || id}”`,
  });

  await revalidateEventPaths(eventId, guest?.account_id);
  return { success: true };
}
