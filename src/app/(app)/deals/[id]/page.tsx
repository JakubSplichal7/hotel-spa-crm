import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { DEAL_STAGE_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/types";
import { updateDealStage } from "@/lib/actions/deals";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { DealStage } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DealDetailPage({ params }: PageProps) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select("*, account:accounts(id, name), owner:profiles!deals_owner_id_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!deal) notFound();

  const [{ data: activities }, { data: tasks }] = await Promise.all([
    supabase
      .from("activities")
      .select("*, creator:profiles!activities_created_by_fkey(full_name)")
      .eq("deal_id", id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assignee_id_fkey(full_name)")
      .eq("deal_id", id)
      .order("due_at"),
  ]);

  const stages: DealStage[] = ["lead", "qualified", "proposal", "negotiation", "won", "lost"];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/deals" className="text-sm text-muted-foreground hover:text-primary">
          &larr; Back to pipeline
        </Link>
        <div className="mt-2">
          <h1 className="text-3xl font-bold">{deal.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{DEAL_STAGE_LABELS[deal.stage]}</Badge>
            <Link href={`/accounts/${(deal.account as { id: string }).id}`} className="text-sm text-primary hover:underline">
              {(deal.account as { name: string }).name}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="text-2xl font-bold">{formatCurrency(Number(deal.value), deal.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Expected Close</p>
            <p className="text-2xl font-bold">
              {deal.expected_close ? formatDate(deal.expected_close) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Owner</p>
            <p className="text-2xl font-bold">
              {(deal.owner as { full_name: string } | null)?.full_name || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-medium">Update Stage</p>
          <div className="flex flex-wrap gap-2">
            {stages.map((stage) => (
              <form key={stage} action={async () => { "use server"; await updateDealStage(id, stage); }}>
                <Button
                  type="submit"
                  variant={deal.stage === stage ? "default" : "outline"}
                  size="sm"
                >
                  {DEAL_STAGE_LABELS[stage]}
                </Button>
              </form>
            ))}
          </div>
        </CardContent>
      </Card>

      {deal.notes && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium">Notes</p>
            <p className="mt-2 text-muted-foreground">{deal.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Activities</h2>
          {!activities?.length ? (
            <p className="text-sm text-muted-foreground">No activities logged</p>
          ) : (
            <div className="space-y-2">
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{ACTIVITY_TYPE_LABELS[activity.type]}</Badge>
                      <span className="font-medium">{activity.subject}</span>
                    </div>
                    {activity.body && <p className="mt-2 text-sm text-muted-foreground">{activity.body}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {(activity.creator as { full_name: string } | null)?.full_name} &middot;{" "}
                      {formatDateTime(activity.occurred_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">Tasks</h2>
          {!tasks?.length ? (
            <p className="text-sm text-muted-foreground">No tasks for this deal</p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(task.assignee as { full_name: string } | null)?.full_name}
                      </p>
                    </div>
                    <Badge variant={task.status === "done" ? "success" : "warning"}>{task.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
