"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { BookingStatus, DealLostReason, DealStage } from "@/lib/types";
import {
  DEAL_LOST_REASONS,
  dealStageNeedsBooking,
  getPrimaryBooking,
} from "@/lib/types";

async function revalidateDealPaths(dealId: string, accountId?: string) {
  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
}

function parseLostFields(input?: {
  lostReason?: string | null;
  lostComment?: string | null;
}):
  | { ok: true; reason: DealLostReason; comment: string }
  | { ok: false; error: string } {
  const reason = String(input?.lostReason || "").trim() as DealLostReason;
  const comment = String(input?.lostComment || "").trim();

  if (!DEAL_LOST_REASONS.includes(reason)) {
    return {
      ok: false,
      error: "Select a lost reason (Price, Date, Capacity, or Services).",
    };
  }
  if (!comment) {
    return {
      ok: false,
      error: "Add a short comment explaining why the offer was lost.",
    };
  }
  return { ok: true, reason, comment };
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

export async function updateDealStage(
  id: string,
  stage: DealStage,
  lost?: { lostReason?: string | null; lostComment?: string | null }
) {
  await requireProfile();
  const supabase = await createClient();

  let lostReason: DealLostReason | null = null;
  let lostComment: string | null = null;

  if (stage === "lost") {
    const parsed = parseLostFields(lost);
    if (!parsed.ok) return { error: parsed.error };
    lostReason = parsed.reason;
    lostComment = parsed.comment;
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .update({
      stage,
      lost_reason: lostReason,
      lost_comment: lostComment,
      ...(stage !== "won" ? { active_booking_declined: false } : {}),
      ...(stage !== "completed" ? { completed_booking_declined: false } : {}),
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

  let lostReason: DealLostReason | null = null;
  let lostComment: string | null = null;

  if (stage === "lost") {
    const parsed = parseLostFields({
      lostReason: formData.get("lost_reason") as string | null,
      lostComment: formData.get("lost_comment") as string | null,
    });
    if (!parsed.ok) return { error: parsed.error };
    lostReason = parsed.reason;
    lostComment = parsed.comment;
  }

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
      lost_reason: lostReason,
      lost_comment: lostComment,
      ...(stage !== "won" ? { active_booking_declined: false } : {}),
      ...(stage !== "completed" ? { completed_booking_declined: false } : {}),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  return { success: true };
}

export async function deleteDeal(
  id: string,
  options?: { deleteLinkedBookings?: boolean }
) {
  await requireProfile();
  const supabase = await createClient();

  if (options?.deleteLinkedBookings) {
    const { error: bookingError } = await supabase
      .from("bookings")
      .delete()
      .eq("deal_id", id);
    if (bookingError) return { error: bookingError.message };
  }

  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath("/bookings");
  return { success: true };
}

export async function deleteDeals(
  ids: string[],
  options?: { deleteLinkedBookings?: boolean }
) {
  await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  if (options?.deleteLinkedBookings) {
    const { error: bookingError } = await supabase
      .from("bookings")
      .delete()
      .in("deal_id", ids);
    if (bookingError) return { error: bookingError.message };
  }

  const { error } = await supabase.from("deals").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath("/bookings");
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

export async function completeBookingForDeal(dealId: string) {
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
      message: "Confirm booking details before setting Completed.",
    };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "completed" satisfies BookingStatus, needs_confirmation: false })
    .eq("id", booking.id);

  if (error) return { error: error.message };

  await supabase
    .from("deals")
    .update({ completed_booking_declined: false })
    .eq("id", dealId);

  await revalidateDealPaths(dealId, booking.account_id);
  revalidatePath(`/bookings/${booking.id}`);
  return { success: true, data: booking };
}

export async function declineCompletedBooking(dealId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({ completed_booking_declined: true })
    .eq("id", dealId);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  return { success: true };
}

export async function setOptionBookingForDeal(dealId: string) {
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
      message: "Confirm booking details before setting Option.",
    };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "option" satisfies BookingStatus, needs_confirmation: false })
    .eq("id", booking.id);

  if (error) return { error: error.message };

  await supabase
    .from("deals")
    .update({ booking_create_declined: false })
    .eq("id", dealId);

  await revalidateDealPaths(dealId, booking.account_id);
  revalidatePath(`/bookings/${booking.id}`);
  return { success: true, data: booking };
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
