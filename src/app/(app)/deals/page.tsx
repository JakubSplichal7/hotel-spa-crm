import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  CompactDate,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";
import {
  getDealStageLabel,
  getPrimaryBooking,
  getOfferBookingHealth,
  offerBookingHealthLabel,
  DEAL_STAGE_LABELS,
  BOOKING_STATUS_LABELS,
  type Booking,
  type BookingStatus,
  type Deal,
  type DealStage,
} from "@/lib/types";
import Link from "next/link";
import { TableExportBar } from "@/components/export-xlsx-button";

function stageBadgeVariant(stage: string) {
  if (stage === "won") return "success" as const;
  if (stage === "completed") return "success" as const;
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
      completed_booking_declined: Boolean(deal.completed_booking_declined),
    });
    return { deal, booking, health };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offers & packages"
        description="Upsells, memberships, and packages for your clients"
      >
        <CreateDealDialog accounts={accounts || []} profiles={profiles || []} />
      </PageHeader>

      {!rows.length ? (
        <EmptyState
          title="No offers yet"
          description="Create your first offer or package for a client."
        />
      ) : (
        <div>
          <TableExportBar
            filename="offers"
            columns={[
              "Offer",
              "Client",
              "Stage",
              "Value",
              "Currency",
              "Expected close",
              "Booking",
              "Booking status",
              "Owner",
            ]}
            rows={rows.map(({ deal, booking, health }) => ({
              Offer: deal.title,
              Client:
                (deal.account as { name?: string } | null)?.name || "",
              Stage:
                DEAL_STAGE_LABELS[deal.stage as DealStage] ??
                getDealStageLabel(deal.stage),
              Value: Number(deal.value),
              Currency: deal.currency || "",
              "Expected close": deal.expected_close || "",
              Booking:
                health === "ok"
                  ? booking
                    ? "Linked"
                    : ""
                  : offerBookingHealthLabel(health),
              "Booking status": booking
                ? BOOKING_STATUS_LABELS[booking.status as BookingStatus] ??
                  booking.status
                : "",
              Owner:
                (deal.owner as { full_name: string } | null)?.full_name || "",
            }))}
          />
          <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                <th className={dateColHeadClass}>Close</th>
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
                  <td className={dateColCellClass}>
                    <CompactDate value={deal.expected_close} />
                  </td>
                  <td className="px-4 py-3">
                    {health !== "ok" ? (
                      <Badge variant="warning">
                        {offerBookingHealthLabel(health)}
                      </Badge>
                    ) : booking ? (
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Linked
                      </Link>
                    ) : (
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
        </div>
      )}
    </div>
  );
}
