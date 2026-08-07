"use server";

import { createClient } from "@/lib/supabase/server";
import { canManageAll, requireProfile } from "@/lib/auth";
import { buildAuditChanges, logAuditEvent } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import type { AccountType, AccountStatus } from "@/lib/types";

const ACCOUNT_AUDIT_FIELDS = [
  { key: "nickname", label: "Client" },
  { key: "name", label: "Official name" },
  { key: "ico", label: "IČO" },
  { key: "type", label: "Type" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "status", label: "Status" },
  { key: "owner_id", label: "Account manager" },
  { key: "is_vip", label: "VIP" },
  { key: "loyalty_tier", label: "Acquisition" },
  { key: "preferences", label: "Preferences" },
];

const CONTACT_AUDIT_FIELDS = [
  { key: "name", label: "Name" },
  { key: "title", label: "Title" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "is_primary", label: "Primary" },
];

const NOTE_AUDIT_FIELDS = [
  { key: "title", label: "Title" },
  { key: "body", label: "Note" },
  { key: "created_by", label: "By" },
];

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
      is_vip: formData.get("is_vip") === "on",
      loyalty_tier: (formData.get("loyalty_tier") as string) || "jana_splichalova",
      preferences: (formData.get("preferences") as string) || null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "account",
    entityId: data.id,
    entityLabel: nickname,
    accountId: data.id,
    summary: `Created client “${nickname}”`,
  });

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

  const { data: before } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const next = {
    nickname,
    name,
    ico,
    type: formData.get("type") as AccountType,
    city: (formData.get("city") as string) || null,
    country: (formData.get("country") as string) || null,
    status: formData.get("status") as AccountStatus,
    owner_id: formData.get("owner_id") as string,
    is_vip: formData.get("is_vip") === "on",
    loyalty_tier: (formData.get("loyalty_tier") as string) || "jana_splichalova",
    preferences: (formData.get("preferences") as string) || null,
  };

  const { error } = await supabase
    .from("accounts")
    .update(next)
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "account",
    entityId: id,
    entityLabel: nickname,
    accountId: id,
    summary: `Updated client “${nickname}”`,
    changes: buildAuditChanges(before, next, ACCOUNT_AUDIT_FIELDS),
  });

  revalidatePath("/accounts");
  revalidatePath(`/accounts/${id}`);
  return { success: true };
}

export async function deleteAccount(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("accounts")
    .select("id, nickname, name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "account",
    entityId: id,
    entityLabel: before?.nickname || before?.name || id,
    accountId: null,
    summary: `Deleted client “${before?.nickname || before?.name || id}”`,
  });

  revalidatePath("/accounts");
  return { success: true };
}

export async function deleteAccounts(ids: string[]) {
  await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { error } = await supabase.from("accounts").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/accounts");
  return { success: true };
}

export async function createContact(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = formData.get("account_id") as string;
  const isPrimary = formData.get("is_primary") === "on";
  const name = formData.get("name") as string;

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
      name,
      title: (formData.get("title") as string) || null,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "contact",
    entityId: data.id,
    entityLabel: name,
    accountId,
    summary: `Added contact “${name}”`,
  });

  revalidatePath(`/accounts/${accountId}`);
  return { data };
}

export async function updateContact(id: string, accountId: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const isPrimary = formData.get("is_primary") === "on";
  const next = {
    name: formData.get("name") as string,
    title: (formData.get("title") as string) || null,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    is_primary: isPrimary,
  };

  const { data: before } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (isPrimary) {
    await supabase
      .from("contacts")
      .update({ is_primary: false })
      .eq("account_id", accountId);
  }

  const { error } = await supabase
    .from("contacts")
    .update(next)
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "contact",
    entityId: id,
    entityLabel: next.name,
    accountId,
    summary: `Updated contact “${next.name}”`,
    changes: buildAuditChanges(before, next, CONTACT_AUDIT_FIELDS),
  });

  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}

export async function deleteContact(id: string, accountId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("contacts")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "contact",
    entityId: id,
    entityLabel: before?.name || id,
    accountId,
    summary: `Deleted contact “${before?.name || id}”`,
  });

  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}

export async function createAccountNote(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = formData.get("account_id") as string;
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Note is required." };

  let createdBy = profile.id;
  if (canManageAll(profile)) {
    const requestedBy = String(formData.get("created_by") || "").trim();
    if (requestedBy) {
      const { data: author } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", requestedBy)
        .eq("org_id", profile.org_id)
        .maybeSingle();
      if (!author) return { error: "Selected author was not found." };
      createdBy = author.id;
    }
  }

  const title = String(formData.get("title") || "").trim() || null;

  const { data, error } = await supabase
    .from("account_notes")
    .insert({
      org_id: profile.org_id,
      account_id: accountId,
      title,
      body,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "account_note",
    entityId: data.id,
    entityLabel: title || body.slice(0, 40),
    accountId,
    summary: `Added note${title ? ` “${title}”` : ""}`,
  });

  revalidatePath(`/accounts/${accountId}`);
  return { data };
}

export async function updateAccountNote(
  id: string,
  accountId: string,
  formData: FormData
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Note is required." };

  const { data: before } = await supabase
    .from("account_notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const updates: {
    title: string | null;
    body: string;
    updated_at: string;
    created_by?: string;
  } = {
    title: String(formData.get("title") || "").trim() || null,
    body,
    updated_at: new Date().toISOString(),
  };

  if (canManageAll(profile)) {
    const requestedBy = String(formData.get("created_by") || "").trim();
    if (requestedBy) {
      const { data: author } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", requestedBy)
        .eq("org_id", profile.org_id)
        .maybeSingle();
      if (!author) return { error: "Selected author was not found." };
      updates.created_by = author.id;
    }
  }

  const { error } = await supabase
    .from("account_notes")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "account_note",
    entityId: id,
    entityLabel: updates.title || body.slice(0, 40),
    accountId,
    summary: `Updated note${updates.title ? ` “${updates.title}”` : ""}`,
    changes: buildAuditChanges(before, updates, NOTE_AUDIT_FIELDS),
  });

  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}

export async function deleteAccountNote(id: string, accountId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("account_notes")
    .select("title, body")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("account_notes").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "account_note",
    entityId: id,
    entityLabel: before?.title || before?.body?.slice(0, 40) || id,
    accountId,
    summary: `Deleted note${before?.title ? ` “${before.title}”` : ""}`,
  });

  revalidatePath(`/accounts/${accountId}`);
  return { success: true };
}
