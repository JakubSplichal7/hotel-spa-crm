"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { BookingStatus } from "@/lib/types";

export async function createBooking(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      org_id: profile.org_id,
      account_id: formData.get("account_id") as string,
      deal_id: (formData.get("deal_id") as string) || null,
      title: formData.get("title") as string,
      start_date: formData.get("start_date") as string,
      end_date: (formData.get("end_date") as string) || null,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      status: (formData.get("status") as BookingStatus) || "draft",
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateBooking(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      title: formData.get("title") as string,
      start_date: formData.get("start_date") as string,
      end_date: (formData.get("end_date") as string) || null,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      status: formData.get("status") as BookingStatus,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  return { success: true };
}

export async function deleteBooking(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/bookings");
  return { success: true };
}
