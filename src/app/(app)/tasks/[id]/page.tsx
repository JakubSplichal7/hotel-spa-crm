import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  formatCompletionDelta,
  getTaskDayDelta,
} from "@/lib/task-dates";
import Link from "next/link";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { TaskStatusToggle } from "@/components/tasks/task-status-toggle";
import { TaskDescriptionCard } from "@/components/tasks/task-description-card";
import {
  getAccountDisplayName,
  type Account,
  type Profile,
  type Task,
} from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: PageProps) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: task }, { data: accounts }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "*, account:accounts(id, name, nickname), deal:deals(id, title), assignee:profiles!tasks_assignee_id_fkey(full_name)"
        )
        .eq("id", id)
        .single(),
      supabase
        .from("accounts")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("nickname"),
      supabase.from("profiles").select("*").eq("org_id", profile.org_id),
    ]);

  if (!task) notFound();

  const deal = task.deal as { id: string; title: string } | null;
  const account = task.account as {
    id: string;
    name: string;
    nickname?: string | null;
  } | null;
  const dueDay = task.due_at?.slice(0, 10) || null;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isOverdue =
    task.status === "open" && dueDay !== null && dueDay < todayStr;
  const delta = getTaskDayDelta(task);
  const taskRecord = task as Task;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href={deal ? `/deals/${deal.id}` : "/tasks"}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            &larr; Back to {deal ? "offer" : "tasks"}
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={
                  task.status === "done"
                    ? "success"
                    : isOverdue
                      ? "destructive"
                      : "warning"
                }
              >
                {isOverdue ? "overdue" : task.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EditTaskDialog
            task={taskRecord}
            accounts={(accounts || []) as Account[]}
            profiles={(profiles || []) as Profile[]}
          />
          <TaskStatusToggle
            taskId={task.id}
            status={task.status}
            taskTitle={task.title}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Client</p>
            {account ? (
              <Link
                href={`/accounts/${account.id}`}
                className="text-lg font-medium text-primary hover:underline"
              >
                {getAccountDisplayName(account)}
              </Link>
            ) : (
              <p className="text-lg font-medium">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Offer</p>
            {deal ? (
              <Link
                href={`/deals/${deal.id}`}
                className="text-lg font-medium text-primary hover:underline"
              >
                {deal.title}
              </Link>
            ) : (
              <p className="text-lg font-medium">—</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Due date</p>
            <p className="text-lg font-medium">
              {task.due_at ? formatDate(task.due_at) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Done on</p>
            <p className="text-lg font-medium">
              {task.completed_at ? formatDate(task.completed_at) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Δ days</p>
            {delta === null ? (
              <p className="text-lg font-medium text-muted-foreground">—</p>
            ) : (
              <p
                className={`text-lg font-medium ${
                  delta.late
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {formatCompletionDelta(delta.days)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Assignee</p>
          <p className="text-lg font-medium">
            {(task.assignee as { full_name: string } | null)?.full_name || "—"}
          </p>
        </CardContent>
      </Card>

      <TaskDescriptionCard
        taskId={task.id}
        description={task.description ?? null}
      />
    </div>
  );
}
