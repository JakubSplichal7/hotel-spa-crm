import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { DealKanban } from "@/components/deals/deal-kanban";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { getDealStageLabel, getPrimaryBooking, getOfferBookingHealth } from "@/lib/types";
import Link from "next/link";
import type { Booking, Deal } from "@/lib/types";

export default async function DealsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: deals }, { data: accounts }, { data: profiles }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("deals")
        .select("*, account:accounts(name)")
        .eq("org_id", profile.org_id)
        .not("stage", "in", '("won","lost")')
        .order("updated_at", { ascending: false }),
      supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("name"),
      supabase.from("profiles").select("*").eq("org_id", profile.org_id),
      supabase
        .from("bookings")
        .select("*")
        .eq("org_id", profile.org_id)
        .not("deal_id", "is", null),
    ]);

  const bookingsByDeal = new Map<string, Booking[]>();
  for (const b of (bookings || []) as Booking[]) {
    if (!b.deal_id) continue;
    const list = bookingsByDeal.get(b.deal_id) || [];
    list.push(b);
    bookingsByDeal.set(b.deal_id, list);
  }

  const dealsWithBooking = ((deals || []) as Deal[]).map((deal) => ({
    ...deal,
    booking_create_declined: Boolean(deal.booking_create_declined),
    active_booking_declined: Boolean(deal.active_booking_declined),
    booking: getPrimaryBooking(bookingsByDeal.get(deal.id)),
  }));

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
          <h1 className="text-3xl font-bold">Offers & packages</h1>
          <p className="text-muted-foreground">
            Upsells, memberships, and packages for your clients
          </p>
        </div>
        <CreateDealDialog accounts={accounts || []} profiles={profiles || []} />
      </div>

      {!dealsWithBooking.length ? (
        <EmptyState
          title="No open offers"
          description="Create your first offer or package for a client."
        />
      ) : (
        <DealKanban deals={dealsWithBooking} />
      )}

      {closedDeals && closedDeals.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Recently Closed</h2>
          <div className="space-y-2">
            {closedDeals.map((deal) => {
              const linked = getPrimaryBooking(bookingsByDeal.get(deal.id));
              const health = getOfferBookingHealth(
                deal.stage,
                linked,
                {
                  booking_create_declined: Boolean(deal.booking_create_declined),
                  active_booking_declined: Boolean(deal.active_booking_declined),
                }
              );
              return (
              <Link key={deal.id} href={`/deals/${deal.id}`}>
                <Card className="hover:bg-muted/30">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(deal.account as { name: string } | null)?.name}
                      </p>
                      {health === "missing_booking" && (
                        <Badge variant="warning" className="mt-1">
                          Missing booking
                        </Badge>
                      )}
                      {health === "missing_active" && (
                        <Badge variant="warning" className="mt-1">
                          No Active booking
                        </Badge>
                      )}
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
