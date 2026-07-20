import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { CreateBookingDialog } from "@/components/bookings/create-booking-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { BOOKING_STATUS_LABELS, getAccountDisplayName } from "@/lib/types";
import type { BookingStatus } from "@/lib/types";
import { TableExportBar } from "@/components/export-xlsx-button";
import {
  CompactDateRange,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";

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
        <div>
          <TableExportBar
            filename="bookings"
            columns={[
              "Booking",
              "Client",
              "Official name",
              "Offer",
              "Start date",
              "End date",
              "Value",
              "Currency",
              "Status",
            ]}
            rows={bookings.map((booking) => ({
              Booking: booking.title,
              Client: getAccountDisplayName(
                booking.account as { name?: string; nickname?: string }
              ),
              "Official name":
                (booking.account as { name?: string } | null)?.name || "",
              Offer: booking.deal
                ? (booking.deal as { title: string }).title
                : "",
              "Start date": booking.start_date || "",
              "End date": booking.end_date || "",
              Value: Number(booking.value),
              Currency: booking.currency || "",
              Status:
                BOOKING_STATUS_LABELS[booking.status as BookingStatus] ??
                booking.status,
            }))}
          />
          <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Booking</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Official name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
                <th className={dateColHeadClass}>Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {booking.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      href={`/accounts/${(booking.account as { id: string }).id}`}
                      className="text-primary hover:underline"
                    >
                      {getAccountDisplayName(
                        booking.account as { name?: string; nickname?: string }
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {(booking.account as { name?: string } | null)?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {booking.deal ? (
                      <Link
                        href={`/deals/${(booking.deal as { id: string }).id}`}
                        className="text-primary hover:underline"
                      >
                        {(booking.deal as { title: string }).title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={dateColCellClass}>
                    <CompactDateRange
                      start={booking.start_date}
                      end={booking.end_date}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(Number(booking.value), booking.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        booking.status === "active"
                          ? "success"
                          : booking.status === "option" ||
                              booking.status === "draft"
                            ? "warning"
                            : booking.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                      }
                    >
                      {BOOKING_STATUS_LABELS[booking.status as BookingStatus] ??
                        booking.status}
                    </Badge>
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
