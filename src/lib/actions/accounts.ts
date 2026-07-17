"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { AccountType, AccountStatus } from "@/lib/types";

export async function createAccount(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      org_id: profile.org_id,
      name: formData.get("name") as string,
      type: (formData.get("type") as AccountType) || "company",
      city: (formData.get("city") as string) || null,
      country: (formData.get("country") as string) || null,
      status: (formData.get("status") as AccountStatus) || "prospect",
      owner_id: (formData.get("owner_id") as string) || profile.id,
      notes: (formData.get("notes") as string) || null,
      is_vip: formData.get("is_vip") === "on",
      loyalty_tier: (formData.get("loyalty_tier") as string) || "jana_splichalova",
      preferences: (formData.get("preferences") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  return { data };
}

export async function updateAccount(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("accounts")
    .update({
      name: formData.get("name") as string,
      type: formData.get("type") as AccountType,
      city: (formData.get("city") as string) || null,
      country: (formData.get("country") as string) || null,
      status: formData.get("status") as AccountStatus,
      owner_id: formData.get("owner_id") as string,
      notes: (formData.get("notes") as string) || null,
      is_vip: formData.get("is_vip") === "on",
      loyalty_tier: (formData.get("loyalty_tier") as string) || "jana_splichalova",
      preferences: (formData.get("preferences") as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${id}`);
  return { success: true };
}

export async function deleteAccount(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/accounts");
  return { success: true };
}

export async function createContact(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = formData.get("account_id") as string;
  const isPrimary = formData.get("is_primary") === "on";

  if (isPrimary) {
    await supabase
      .from("contacts")
      .update({ is_primary: false })
      .eq("account_id", accountId);
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      org_id: profile.org_id,
      account_id: accountId,
      name: formData.get("name") as string,
      title: (formData.get("title") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/accounts/${accountId}`);
  return { data };
}

export async function deleteContact(id: string, accountId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}
