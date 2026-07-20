import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { OffersTable } from "@/components/deals/offers-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import {
  getPrimaryBooking,
  getOfferBookingHealth,
  type Booking,
  type Deal,
} from "@/lib/types";

export default async function DealsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: deals }, { data: accounts }, { data: profiles }, { data: bookings }] =
    await Promise.all([
      supabase
        .from("deals")
        .select(
          "*, account:accounts(id, name, nickname), owner:profiles!deals_owner_id_fkey(full_name)"
        )
        .eq("org_id", profile.org_id)
        .order("updated_at", { ascending: false }),
      supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("nickname"),
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
        <OffersTable rows={rows} />
      )}
    </div>
  );
}
