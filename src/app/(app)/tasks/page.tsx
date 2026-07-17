import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskList } from "@/components/tasks/task-list";
import { ClientOfferFilter } from "@/components/client-offer-filter";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Account, Profile, Task } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ client?: string; offer?: string }>;
}

export default async function TasksPage({ searchParams }: PageProps) {
  const profile = await requireProfile();
  const params = await searchParams;
  const clientId = params.client && params.client !== "all" ? params.client : null;
  const offerId = params.offer && params.offer !== "all" ? params.offer : null;
  const supabase = await createClient();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
  if (clientId && offerId) {
    openQuery = openQuery.eq("deal_id", offerId);
    doneQuery = doneQuery.eq("deal_id", offerId);
  }

  const [
    { data: openTasks },
    { data: doneTasks },
    { data: accounts },
    { data: profiles },
    { data: offers },
  ] = await Promise.all([
    openQuery,
    doneQuery,
    supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
    supabase.from("profiles").select("*").eq("org_id", profile.org_id),
    supabase
      .from("deals")
      .select("id, title, account_id")
      .eq("org_id", profile.org_id)
      .order("title"),
  ]);

  const overdueCount = (openTasks || []).filter(
    (t) => t.due_at && t.due_at.slice(0, 10) < todayStr
  ).length;

  const selectedClient = clientId
    ? (accounts || []).find((a) => a.id === clientId)
    : null;
  const selectedOffer =
    clientId && offerId
      ? (offers || []).find((o) => o.id === offerId && o.account_id === clientId)
      : null;

  const filterHint = [selectedClient?.name, selectedOffer?.title]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description={
          <>
            {openTasks?.length || 0} open
            {overdueCount > 0 && (
              <span className="text-red-700">
                {" "}
                &middot; {overdueCount} overdue
              </span>
            )}
            {filterHint ? ` · ${filterHint}` : ""}
          </>
        }
      >
        <CreateTaskDialog
          accounts={(accounts || []) as Account[]}
          profiles={(profiles || []) as Profile[]}
          defaultAccountId={clientId || undefined}
          defaultDealId={selectedOffer?.id}
        />
      </PageHeader>

      <Suspense fallback={null}>
        <ClientOfferFilter
          accounts={(accounts || []) as Account[]}
          offers={offers || []}
          basePath="/tasks"
        />
      </Suspense>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({openTasks?.length || 0})</TabsTrigger>
          <TabsTrigger value="done">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4">
          {!openTasks?.length ? (
            <EmptyState
              title={
                selectedOffer
                  ? "No open tasks for this offer"
                  : clientId
                    ? "No open tasks for this client"
                    : "No open tasks"
              }
              description={
                clientId
                  ? "Try another filter or create a new task."
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
                selectedOffer
                  ? "No completed tasks for this offer"
                  : clientId
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
