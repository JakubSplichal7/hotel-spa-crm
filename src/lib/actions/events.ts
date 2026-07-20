"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function revalidateEventPaths(eventId: string) {
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
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

export async function createEventGuest(eventId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Guest name is required." };

  const { data, error } = await supabase
    .from("event_guests")
    .insert({
      org_id: profile.org_id,
      event_id: eventId,
      name,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await revalidateEventPaths(eventId);
  return { data };
}

export async function deleteEventGuest(id: string, eventId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("event_guests").delete().eq("id", id);
  if (error) return { error: error.message };

  await revalidateEventPaths(eventId);
  return { success: true };
}
