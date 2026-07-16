"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { TaskStatus } from "@/lib/types";

export async function createTask(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = formData.get("account_id") as string;
  const dealId = formData.get("deal_id") as string;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      org_id: profile.org_id,
      account_id: accountId || null,
      deal_id: dealId || null,
      title: formData.get("title") as string,
      due_at: (formData.get("due_at") as string) || null,
      status: "open",
      assignee_id: (formData.get("assignee_id") as string) || profile.id,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { data };
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTask(id: string) {
  await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  return { success: true };
}
