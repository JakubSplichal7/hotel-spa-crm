"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createIdea(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const { data, error } = await supabase
    .from("ideas")
    .insert({
      org_id: profile.org_id,
      name,
      note: String(formData.get("note") || "").trim() || null,
      contact: String(formData.get("contact") || "").trim() || null,
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

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name is required." };

  const { error } = await supabase
    .from("ideas")
    .update({
      name,
      note: String(formData.get("note") || "").trim() || null,
      contact: String(formData.get("contact") || "").trim() || null,
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
