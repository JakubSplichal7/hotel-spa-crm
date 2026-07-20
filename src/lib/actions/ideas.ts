"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
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

  revalidatePath("/ideas");
  return { data };
}

export async function updateIdea(id: string, formData: FormData) {
  await requireProfile();
  const supabase = await createClient();

  const fields = ideaFieldsFromForm(formData);
  if (!fields.name) return { error: "Name is required." };

  const { error } = await supabase
    .from("ideas")
    .update({
      ...fields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/ideas");
  return { success: true };
}

export async function deleteIdea(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("ideas").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/ideas");
  return { success: true };
}

export async function deleteIdeas(ids: string[]) {
  await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { error } = await supabase.from("ideas").delete().in("id", ids);
  if (error) return { error: error.message };

  revalidatePath("/ideas");
  return { success: true };
}
