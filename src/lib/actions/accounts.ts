"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { AccountType, AccountStatus } from "@/lib/types";

/** Normalize IČO for storage and duplicate checks (digits only). */
function normalizeIco(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

async function findAccountsWithIco(
  orgId: string,
  ico: string,
  excludeId?: string
) {
  const supabase = await createClient();
  let query = supabase
    .from("accounts")
    .select("id, name, nickname")
    .eq("org_id", orgId)
    .eq("ico", ico);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) return { error: error.message, matches: [] as { id: string; name: string; nickname?: string | null }[] };
  return { matches: data || [], error: null as string | null };
}

export async function createAccount(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const ico = normalizeIco(String(formData.get("ico") || ""));
  const allowDuplicate = formData.get("allow_duplicate_ico") === "1";

  if (!nickname) return { error: "Client is required." };
  if (!name) return { error: "Official name is required." };
  if (!ico) return { error: "IČO is required." };

  if (!allowDuplicate) {
    const { matches, error: dupError } = await findAccountsWithIco(
      profile.org_id,
      ico
    );
    if (dupError) return { error: dupError };
    if (matches.length > 0) {
      return {
        duplicate: true as const,
        ico,
        existingNames: matches.map(
          (m) => m.nickname || m.name
        ),
      };
    }
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert({
      org_id: profile.org_id,
      nickname,
      name,
      ico,
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
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const nickname = String(formData.get("nickname") || "").trim();
  const ico = normalizeIco(String(formData.get("ico") || ""));
  const allowDuplicate = formData.get("allow_duplicate_ico") === "1";

  if (!nickname) return { error: "Client is required." };
  if (!name) return { error: "Official name is required." };
  if (!ico) return { error: "IČO is required." };

  if (!allowDuplicate) {
    const { matches, error: dupError } = await findAccountsWithIco(
      profile.org_id,
      ico,
      id
    );
    if (dupError) return { error: dupError };
    if (matches.length > 0) {
      return {
        duplicate: true as const,
        ico,
        existingNames: matches.map(
          (m) => m.nickname || m.name
        ),
      };
    }
  }

  const { error } = await supabase
    .from("accounts")
    .update({
      nickname,
      name,
      ico,
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
