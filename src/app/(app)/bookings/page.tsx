import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateBookingDialog } from "@/components/bookings/create-booking-dialog";
import { BookingsTable } from "@/components/bookings/bookings-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default async function BookingsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: bookings }, { data: accounts }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, account:accounts(id, name, nickname), deal:deals(id, title)")
      .eq("org_id", profile.org_id)
      .order("start_date", { ascending: false }),
    supabase.from("accounts").select("*").eq("org_id", profile.org_id).order("nickname"),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings & stays"
        description="Stays, spa visits, and events for your clients"
      >
        <CreateBookingDialog accounts={accounts || []} />
      </PageHeader>

      {!bookings?.length ? (
        <EmptyState
          title="No bookings yet"
          description="Record stays, spa appointments, and events linked to your clients."
        />
      ) : (
        <BookingsTable bookings={bookings} />
      )}
    </div>
  );
}
