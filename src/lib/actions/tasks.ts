"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { TaskStatus } from "@/lib/types";

function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function createTask(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = formData.get("account_id") as string;
  const dealId = formData.get("deal_id") as string;
  const dueAt = (formData.get("due_at") as string) || null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      org_id: profile.org_id,
      account_id: accountId || null,
      deal_id: dealId || null,
      title: formData.get("title") as string,
      due_at: dueAt || null,
      completed_at: null,
      status: "open",
      assignee_id: (formData.get("assignee_id") as string) || profile.id,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  return { data };
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  completedAt?: string | null
) {
  await requireProfile();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("deal_id, account_id")
    .eq("id", id)
    .single();

  let completed_at: string | null = null;
  if (status === "done") {
    completed_at = completedAt?.trim() || todayDateString();
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  if (existing?.deal_id) revalidatePath(`/deals/${existing.deal_id}`);
  if (existing?.account_id) revalidatePath(`/accounts/${existing.account_id}`);
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
