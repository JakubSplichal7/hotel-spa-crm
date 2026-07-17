import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  getDealStageLabel,
  getPrimaryBooking,
  getOfferBookingHealth,
  DEAL_STAGE_LABELS,
  type Booking,
  type Deal,
  type DealStage,
} from "@/lib/types";
import Link from "next/link";

function stageBadgeVariant(stage: string) {
  if (stage === "won") return "success" as const;
  if (stage === "lost") return "destructive" as const;
  if (stage === "proposal" || stage === "negotiation") return "warning" as const;
  return "secondary" as const;
}

export default async function DealsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: deals }, { data: accounts }, { data: profiles }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("deals")
        .select(
          "*, account:accounts(id, name), owner:profiles!deals_owner_id_fkey(full_name)"
        )
        .eq("org_id", profile.org_id)
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

  const rows = ((deals || []) as Deal[]).map((deal) => {
    const booking = getPrimaryBooking(bookingsByDeal.get(deal.id));
    const health = getOfferBookingHealth(deal.stage, booking, {
      booking_create_declined: Boolean(deal.booking_create_declined),
      active_booking_declined: Boolean(deal.active_booking_declined),
    });
    return { deal, booking, health };
  });

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

      {!rows.length ? (
        <EmptyState
          title="No offers yet"
          description="Create your first offer or package for a client."
        />
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Expected close</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Booking</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ deal, booking, health }) => (
                <tr key={deal.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {deal.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(deal.account as { id?: string; name?: string } | null)?.id ? (
                      <Link
                        href={`/accounts/${(deal.account as { id: string }).id}`}
                        className="hover:underline"
                      >
                        {(deal.account as { name: string }).name}
                      </Link>
                    ) : (
                      (deal.account as { name?: string } | null)?.name || "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={stageBadgeVariant(deal.stage)}>
                      {DEAL_STAGE_LABELS[deal.stage as DealStage] ??
                        getDealStageLabel(deal.stage)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(Number(deal.value), deal.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {deal.expected_close ? formatDate(deal.expected_close) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {health === "missing_booking" && (
                      <Badge variant="warning">Missing booking</Badge>
                    )}
                    {health === "needs_confirmation" && (
                      <Badge variant="warning">Needs confirm</Badge>
                    )}
                    {health === "missing_active" && (
                      <Badge variant="warning">No Active</Badge>
                    )}
                    {health === "status_mismatch" && (
                      <Badge variant="warning">Mismatch</Badge>
                    )}
                    {health === "ok" && booking && (
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Linked
                      </Link>
                    )}
                    {health === "ok" && !booking && (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(deal.owner as { full_name: string } | null)?.full_name || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
