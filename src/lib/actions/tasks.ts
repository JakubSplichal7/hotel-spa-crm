"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { buildAuditChanges } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import type { TaskStatus } from "@/lib/types";

const TASK_AUDIT_FIELDS = [
  { key: "title", label: "Task" },
  { key: "description", label: "Description" },
  { key: "due_at", label: "Due date" },
  { key: "status", label: "Status" },
  { key: "assignee_id", label: "Assignee" },
  { key: "account_id", label: "Client" },
  { key: "deal_id", label: "Offer" },
  { key: "completed_at", label: "Done on" },
];

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
  const eventId = (formData.get("event_id") as string) || null;
  const dueAt = (formData.get("due_at") as string) || null;
  const title = formData.get("title") as string;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      org_id: profile.org_id,
      account_id: accountId || null,
      deal_id: dealId || null,
      event_id: eventId,
      title,
      description: String(formData.get("description") || "").trim() || null,
      due_at: dueAt || null,
      completed_at: null,
      status: "open",
      assignee_id: (formData.get("assignee_id") as string) || profile.id,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "created",
    entityType: "task",
    entityId: data.id,
    entityLabel: title,
    accountId: accountId || null,
    summary: `Created task “${title}”`,
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { data };
}

export async function updateTask(id: string, formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const accountId = (formData.get("account_id") as string) || null;
  const dealId = (formData.get("deal_id") as string) || null;
  const eventId = (formData.get("event_id") as string) || null;
  const dueAt = (formData.get("due_at") as string) || null;
  const assigneeId = formData.get("assignee_id") as string;
  const title = formData.get("title") as string;

  const { data: before } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const next = {
    account_id: accountId,
    deal_id: dealId,
    event_id: eventId,
    title,
    description: String(formData.get("description") || "").trim() || null,
    due_at: dueAt || null,
    assignee_id: assigneeId,
  };

  const { error } = await supabase.from("tasks").update(next).eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "task",
    entityId: id,
    entityLabel: title,
    accountId: accountId || before?.account_id || null,
    summary: `Updated task “${title}”`,
    changes: buildAuditChanges(before, next, TASK_AUDIT_FIELDS),
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  if (accountId) revalidatePath(`/accounts/${accountId}`);
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (eventId) revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function updateTaskDescription(id: string, description: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("account_id, deal_id, event_id, title, description")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({
      description: description.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "task",
    entityId: id,
    entityLabel: existing?.title || id,
    accountId: existing?.account_id || null,
    summary: `Updated task description “${existing?.title || id}”`,
    changes: buildAuditChanges(
      existing,
      { description: description.trim() || null },
      [{ key: "description", label: "Description" }]
    ),
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  if (existing?.account_id) revalidatePath(`/accounts/${existing.account_id}`);
  if (existing?.deal_id) revalidatePath(`/deals/${existing.deal_id}`);
  if (existing?.event_id) revalidatePath(`/events/${existing.event_id}`);
  return { success: true };
}

export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
  completedAt?: string | null
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("deal_id, account_id, event_id, title, status, completed_at")
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

  await logAuditEvent({
    profile,
    action: "updated",
    entityType: "task",
    entityId: id,
    entityLabel: existing?.title || id,
    accountId: existing?.account_id || null,
    summary: `Marked task “${existing?.title || id}” as ${status}`,
    changes: buildAuditChanges(
      existing,
      { status, completed_at },
      [
        { key: "status", label: "Status" },
        { key: "completed_at", label: "Done on" },
      ]
    ),
  });

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/dashboard");
  if (existing?.deal_id) revalidatePath(`/deals/${existing.deal_id}`);
  if (existing?.account_id) revalidatePath(`/accounts/${existing.account_id}`);
  if (existing?.event_id) revalidatePath(`/events/${existing.event_id}`);
  return { success: true };
}

export async function deleteTask(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("tasks")
    .select("title, account_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };

  await logAuditEvent({
    profile,
    action: "deleted",
    entityType: "task",
    entityId: id,
    entityLabel: before?.title || id,
    accountId: before?.account_id || null,
    summary: `Deleted task “${before?.title || id}”`,
  });

  revalidatePath("/tasks");
  return { success: true };
}

export async function deleteTasks(ids: string[]) {
  const profile = await requireProfile();
  if (!ids.length) return { success: true };
  const supabase = await createClient();

  const { data: before } = await supabase
    .from("tasks")
    .select("id, title, account_id")
    .in("id", ids);

  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) return { error: error.message };

  for (const row of before || []) {
    await logAuditEvent({
      profile,
      action: "deleted",
      entityType: "task",
      entityId: row.id,
      entityLabel: row.title,
      accountId: row.account_id,
      summary: `Deleted task “${row.title}”`,
    });
  }

  revalidatePath("/tasks");
  return { success: true };
}
