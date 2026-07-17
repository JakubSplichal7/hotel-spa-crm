import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { ClientFilter } from "@/components/client-filter";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Account, Profile, Task } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ client?: string }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const params = await searchParams;
  const clientId = params.client && params.client !== "all" ? params.client : null;
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let openQuery = supabase
    .from("tasks")
    .select(
      "*, account:accounts(id, name), deal:deals(id, title), assignee:profiles!tasks_assignee_id_fkey(full_name)"
    )
    .eq("org_id", profile.org_id)
    .eq("status", "open")
    .order("due_at", { ascending: true });

  let doneQuery = supabase
    .from("tasks")
    .select(
      "*, account:accounts(id, name), deal:deals(id, title), assignee:profiles!tasks_assignee_id_fkey(full_name)"
    )
    .eq("org_id", profile.org_id)
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(20);

  if (clientId) {
    openQuery = openQuery.eq("account_id", clientId);
    doneQuery = doneQuery.eq("account_id", clientId);
  }

  const [{ data: openTasks }, { data: doneTasks }, { data: accounts }, { data: profiles }] =
    await Promise.all([
      openQuery,
      doneQuery,
      supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
      supabase.from("profiles").select("*").eq("org_id", profile.org_id),
    ]);

  const overdueCount = (openTasks || []).filter(
    (t) => t.due_at && new Date(t.due_at) < today
  ).length;

  const selectedClient = clientId
    ? (accounts || []).find((a) => a.id === clientId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {openTasks?.length || 0} open
            {overdueCount > 0 && (
              <span className="text-destructive">
                {" "}
                &middot; {overdueCount} overdue
              </span>
            )}
            {selectedClient ? ` · ${selectedClient.name}` : ""}
          </p>
        </div>
        <CreateTaskDialog
          accounts={(accounts || []) as Account[]}
          profiles={(profiles || []) as Profile[]}
          defaultAccountId={clientId || undefined}
        />
      </div>

      <Suspense fallback={null}>
        <ClientFilter accounts={(accounts || []) as Account[]} basePath="/tasks" />
      </Suspense>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({openTasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {!openTasks?.length ? (
            <EmptyState
              title={clientId ? "No open tasks for this client" : "No open tasks"}
              description={
                clientId
                  ? "Try another client or create a new task."
                  : "Create a follow-up task to stay on track."
              }
            />
          ) : (
            <TaskList tasks={(openTasks || []) as Task[]} />
          )}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {!doneTasks?.length ? (
            <EmptyState
              title={
                clientId
                  ? "No completed tasks for this client"
                  : "No completed tasks"
              }
              description="Completed tasks will appear here."
            />
          ) : (
            <TaskList tasks={(doneTasks || []) as Task[]} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
