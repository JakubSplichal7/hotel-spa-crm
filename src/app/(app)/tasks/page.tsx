import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/lib/types";

export default async function TasksPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ data: openTasks }, { data: doneTasks }, { data: accounts }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, account:accounts(id, name), assignee:profiles!tasks_assignee_id_fkey(full_name)")
        .eq("org_id", profile.org_id)
        .eq("status", "open")
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("tasks")
        .select("*, account:accounts(id, name), assignee:profiles!tasks_assignee_id_fkey(full_name)")
        .eq("org_id", profile.org_id)
        .eq("status", "done")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
      supabase.from("profiles").select("*").eq("org_id", profile.org_id),
    ]);

  const overdueCount = (openTasks || []).filter(
    (t) => t.due_at && new Date(t.due_at) < today
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">
            {openTasks?.length || 0} open
            {overdueCount > 0 && (
              <span className="text-destructive"> &middot; {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <CreateTaskDialog accounts={accounts || []} profiles={profiles || []} />
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({openTasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {!openTasks?.length ? (
            <EmptyState title="No open tasks" description="Create a follow-up task to stay on track." />
          ) : (
            <TaskList tasks={(openTasks || []) as Task[]} />
          )}
        </TabsContent>
        <TabsContent value="done" className="mt-4">
          {!doneTasks?.length ? (
            <EmptyState title="No completed tasks" description="Completed tasks will appear here." />
          ) : (
            <TaskList tasks={(doneTasks || []) as Task[]} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
