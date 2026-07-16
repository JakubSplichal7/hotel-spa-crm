"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { DealStage } from "@/lib/types";

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

  const { error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true };
}

export async function updateDeal(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("deals")
    .update({
      title: formData.get("title") as string,
      stage: formData.get("stage") as DealStage,
      value: parseFloat(formData.get("value") as string) || 0,
      currency: (formData.get("currency") as string) || "EUR",
      expected_close: (formData.get("expected_close") as string) || null,
      owner_id: formData.get("owner_id") as string,
      notes: (formData.get("notes") as string) || null,
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
