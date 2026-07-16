import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { DealKanban } from "@/components/deals/deal-kanban";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getDealStageLabel } from "@/lib/types";
import Link from "next/link";
import type { Deal } from "@/lib/types";

export default async function DealsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: deals }, { data: accounts }, { data: profiles }] = await Promise.all([
    supabase
      .from("deals")
      .select("*, account:accounts(name)")
      .eq("org_id", profile.org_id)
      .not("stage", "in", '("won","lost")')
      .order("updated_at", { ascending: false }),
    supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
    supabase.from("profiles").select("*").eq("org_id", profile.org_id),
  ]);

  const { data: closedDeals } = await supabase
    .from("deals")
    .select("*, account:accounts(name)")
    .eq("org_id", profile.org_id)
    .in("stage", ["won", "lost"])
    .order("updated_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deals Pipeline</h1>
          <p className="text-muted-foreground">Track opportunities through your sales stages</p>
        </div>
        <CreateDealDialog accounts={accounts || []} profiles={profiles || []} />
      </div>

      {!deals?.length ? (
        <EmptyState
          title="No open deals"
          description="Create your first deal to start building your pipeline."
        />
      ) : (
        <DealKanban deals={(deals || []) as Deal[]} />
      )}

      {closedDeals && closedDeals.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Recently Closed</h2>
          <div className="space-y-2">
            {closedDeals.map((deal) => (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <Card className="hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(deal.account as { name: string } | null)?.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={deal.stage === "won" ? "success" : "destructive"}>
                        {getDealStageLabel(deal.stage)}
                      </Badge>
                      <span className="font-medium">
                        {formatCurrency(Number(deal.value), deal.currency)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
