"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { BookingStatus, DealStage } from "@/lib/types";

function targetStatusForDealStage(stage: DealStage | null | undefined): BookingStatus {
  if (stage === "won") return "active";
  if (stage === "proposal" || stage === "negotiation") return "option";
  return "option";
}

/** Returns an error message when end is before start; null when valid. */
function invalidDateRangeError(
  startDate: string | null,
  endDate: string | null
): string | null {
  if (!startDate || !endDate) return null;
  if (endDate < startDate) {
    return "End date cannot be earlier than start date. Please correct the dates and try again.";
  }
  return null;
}

export async function createBooking(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  if (startDate && endDate && endDate < startDate) {
    return {
      error:
        "Booking cannot be created: end date cannot be earlier than start date. Please correct the dates and try again.",
    };
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      org_id: profile.org_id,
      account_id: formData.get("account_id") as string,
      deal_id: (formData.get("deal_id") as string) || null,
      title: formData.get("title") as string,
      start_date: startDate,
      end_date: endDate,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      status: (formData.get("status") as BookingStatus) || "draft",
      needs_confirmation: formData.get("needs_confirmation") === "true",
      notes: (formData.get("notes") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath("/dashboard");
  if (data.deal_id) revalidatePath(`/deals/${data.deal_id}`);
  return { data };
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status,
      ...(status !== "draft" ? { needs_confirmation: false } : {}),
    })
    .eq("id", id)
    .select("id, deal_id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/dashboard");
  if (data?.deal_id) revalidatePath(`/deals/${data.deal_id}`);
  return { success: true };
}

export async function updateBooking(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const status = formData.get("status") as BookingStatus;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;
  const dealIdRaw = (formData.get("deal_id") as string) || "";
  const dealId = dealIdRaw.trim() || null;

  const rangeError = invalidDateRangeError(startDate, endDate);
  if (rangeError) return { error: rangeError };

  const { data: existing, error: loadError } = await supabase
    .from("bookings")
    .select("id, account_id, deal_id")
    .eq("id", id)
    .single();

  if (loadError || !existing) {
    return { error: loadError?.message || "Booking not found" };
  }

  if (dealId) {
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select("id, account_id")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return { error: dealError?.message || "Offer not found" };
    }
    if (deal.account_id !== existing.account_id) {
      return { error: "Offer must belong to the same client as this booking" };
    }

    const { data: linked } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("deal_id", dealId)
      .neq("id", id);

    const other = (linked || []).find((b) => b.status !== "cancelled");
    if (other) {
      return {
        error:
          "That offer already has another booking linked. Unlink it first, or pick a different offer.",
      };
    }
  }

  const previousDealId = existing.deal_id as string | null;

  const { data, error } = await supabase
    .from("bookings")
    .update({
      title: formData.get("title") as string,
      start_date: startDate,
      end_date: endDate,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      status,
      notes: (formData.get("notes") as string) || null,
      deal_id: dealId,
      ...(status !== "draft" ? { needs_confirmation: false } : {}),
    })
    .eq("id", id)
    .select("id, deal_id")
    .single();

  if (error) return { error: error.message };

  if (dealId) {
    await supabase
      .from("deals")
      .update({ booking_create_declined: false })
      .eq("id", dealId);
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  if (previousDealId) revalidatePath(`/deals/${previousDealId}`);
  if (data?.deal_id) revalidatePath(`/deals/${data.deal_id}`);
  return { success: true };
}

/** Confirm a linked booking after offer create — sets Option or Active from offer stage */
export async function confirmLinkedBooking(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const { data: booking, error: loadError } = await supabase
    .from("bookings")
    .select("*, deal:deals(id, stage)")
    .eq("id", id)
    .single();

  if (loadError || !booking) return { error: loadError?.message || "Booking not found" };

  const startDate = (formData.get("start_date") as string) || null;
  if (!startDate) return { error: "Start date is required to confirm the booking" };

  const endDate = (formData.get("end_date") as string) || null;
  if (endDate && endDate < startDate) {
    return {
      error:
        "Booking cannot be confirmed: end date cannot be earlier than start date. Please correct the dates and try again.",
    };
  }

  const dealStage = (booking.deal as { stage: DealStage } | null)?.stage;
  const forcedStatus = (formData.get("status") as BookingStatus) || null;
  const status = forcedStatus || targetStatusForDealStage(dealStage);

  const { error } = await supabase
    .from("bookings")
    .update({
      title: formData.get("title") as string,
      start_date: startDate,
      end_date: endDate,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      status,
      notes: (formData.get("notes") as string) || null,
      needs_confirmation: false,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  if (booking.deal_id) {
    const dealUpdate: Record<string, boolean> = { booking_create_declined: false };
    if (status === "active") dealUpdate.active_booking_declined = false;
    await supabase.from("deals").update(dealUpdate).eq("id", booking.deal_id);
    revalidatePath(`/deals/${booking.deal_id}`);
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/dashboard");
  return { success: true, status };
}

export async function deleteBooking(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("deal_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/bookings");
  if (booking?.deal_id) revalidatePath(`/deals/${booking.deal_id}`);
  return { success: true };
}
