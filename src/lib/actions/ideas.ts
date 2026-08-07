"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { buildAuditChanges } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";

function ideaFieldsFromForm(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description =
    String(formData.get("description") || formData.get("note") || "").trim() ||
    null;
  return {
    name,
    note: description,
  };
}

export async function createIdea(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const fields = ideaFieldsFromForm(formData);
  if (!fields.name) return { error: "Name is required." };

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      org_id: profile.org_id,
      ...fields,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "idea",
    entityId: data.id,
    entityLabel: fields.name,
    summary: `Created idea “${fields.name}”`,
  });

  revalidatePath("/ideas");
  return { data };
}

export async function updateIdea(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const fields = ideaFieldsFromForm(formData);
  if (!fields.name) return { error: "Name is required." };

  const { data: before } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("ideas")
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "idea",
    entityId: id,
    entityLabel: fields.name,
    summary: `Updated idea “${fields.name}”`,
    changes: buildAuditChanges(before, fields, [
      { key: "name", label: "Name" },
      { key: "note", label: "Description" },
    ]),
  });

  revalidatePath("/ideas");
  return { success: true };
}

export async function deleteIdea(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("ideas")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "idea",
    entityId: id,
    entityLabel: before?.name || id,
    summary: `Deleted idea “${before?.name || id}”`,
  });

  revalidatePath("/ideas");
  return { success: true };
}

export async function deleteIdeas(ids: string[]) {
  const profile = await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("ideas")
    .select("id, name")
    .in("id", ids);

  const { error } = await supabase.from("ideas").delete().in("id", ids);
  if (error) return { error: error.message };

  for (const row of before || []) {
    await logAuditEvent({
      profile,
      action: "deleted",
      entityType: "idea",
      entityId: row.id,
      entityLabel: row.name,
      summary: `Deleted idea “${row.name}”`,
    });
  }

  revalidatePath("/ideas");
  return { success: true };
}
