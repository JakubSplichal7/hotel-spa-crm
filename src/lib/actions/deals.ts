"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { BookingStatus, DealStage } from "@/lib/types";
import { dealStageNeedsBooking, getPrimaryBooking } from "@/lib/types";

async function revalidateDealPaths(dealId: string, accountId?: string) {
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
}

export async function createDeal(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("deals")
    .insert({
      org_id: profile.org_id,
      account_id: formData.get("account_id") as string,
      title: formData.get("title") as string,
      stage: (formData.get("stage") as DealStage) || "lead",
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      expected_close: (formData.get("expected_close") as string) || null,
      owner_id: (formData.get("owner_id") as string) || profile.id,
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateDealStage(id: string, stage: DealStage) {
  await requireProfile();
  const supabase = await createClient();

  const { data: deal, error } = await supabase
    .from("deals")
    .update({
      stage,
      ...(stage !== "won" ? { active_booking_declined: false } : {}),
      ...(dealStageNeedsBooking(stage) ? {} : { booking_create_declined: false }),
    })
    .eq("id", id)
    .select("id, account_id, stage")
    .single();

  if (error) return { error: error.message };

  await revalidateDealPaths(id, deal?.account_id);
  return { success: true, data: deal };
}

export async function updateDeal(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const stage = formData.get("stage") as DealStage;

  const { error } = await supabase
    .from("deals")
    .update({
      title: formData.get("title") as string,
      stage,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      expected_close: (formData.get("expected_close") as string) || null,
      owner_id: formData.get("owner_id") as string,
      notes: (formData.get("notes") as string) || null,
      ...(stage !== "won" ? { active_booking_declined: false } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return { success: true };
}

export async function deleteDeal(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/deals");
  return { success: true };
}

/** Create a Draft booking linked to an offer; opens for confirmation in UI */
export async function createBookingFromDeal(dealId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (dealError || !deal) return { error: dealError?.message || "Offer not found" };

  const { data: existing } = await supabase
    .from("bookings")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  const primary = getPrimaryBooking(existing || []);
  if (primary && primary.status !== "cancelled") {
    return { data: primary, existing: true };
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      org_id: profile.org_id,
      account_id: deal.account_id,
      deal_id: deal.id,
      title: deal.title,
      start_date: deal.expected_close || null,
      end_date: null,
      value: deal.value,
      currency: deal.currency,
      status: "draft" satisfies BookingStatus,
      needs_confirmation: true,
      notes: deal.notes
        ? `Created from offer. ${deal.notes}`
        : "Created from offer — confirm dates and details.",
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase
    .from("deals")
    .update({ booking_create_declined: false })
    .eq("id", dealId);

  await revalidateDealPaths(dealId, deal.account_id);
  revalidatePath(`/bookings/${booking.id}`);
  return { data: booking, existing: false };
}

export async function declineBookingCreate(dealId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({ booking_create_declined: true })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}

export async function activateBookingForDeal(dealId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  const booking = getPrimaryBooking(bookings || []);
  if (!booking) return { error: "No linked booking found" };

  if (booking.needs_confirmation || booking.status === "draft" || !booking.start_date) {
    return {
      error: "confirm_required",
      bookingId: booking.id,
      message: "Confirm booking details before setting Active.",
    };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "active", needs_confirmation: false })
    .eq("id", booking.id);

  if (error) return { error: error.message };

  await supabase
    .from("deals")
    .update({ active_booking_declined: false })
    .eq("id", dealId);

  await revalidateDealPaths(dealId, booking.account_id);
  revalidatePath(`/bookings/${booking.id}`);
  return { success: true, data: booking };
}

export async function declineActiveBooking(dealId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({ active_booking_declined: true })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}

export async function cancelBookingForLostDeal(dealId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: true });

  const booking = getPrimaryBooking(bookings || []);
  if (!booking) return { success: true, skipped: true };

  if (booking.status === "cancelled" || booking.status === "completed") {
    return { success: true, skipped: true };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", needs_confirmation: false })
    .eq("id", booking.id);

  if (error) return { error: error.message };

  await revalidateDealPaths(dealId, booking.account_id);
  revalidatePath(`/bookings/${booking.id}`);
  return { success: true, data: booking };
}
