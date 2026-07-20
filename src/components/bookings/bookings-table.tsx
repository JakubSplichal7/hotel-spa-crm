"use client";

import {
  BulkRowCheckbox,
  BulkSelectAllCheckbox,
  BulkTableToolbar,
  bulkCheckboxCellClass,
  bulkCheckboxHeadClass,
  useBulkSelection,
} from "@/components/bulk-selection";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  BOOKING_STATUS_LABELS,
  getAccountDisplayName,
  type Booking,
  type BookingStatus,
} from "@/lib/types";
import { deleteBookings } from "@/lib/actions/bookings";
import {
  CompactDateRange,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";

type BookingRow = Booking & {
  account?: { id: string; name?: string; nickname?: string } | null;
  deal?: { id: string; title: string } | null;
};

export function BookingsTable({ bookings }: { bookings: BookingRow[] }) {
  const selection = useBulkSelection(bookings.map((b) => b.id));

  return (
    <div>
      <BulkTableToolbar
        selection={selection}
        entityLabel="booking"
        onDelete={deleteBookings}
        exportFilename="bookings"
        exportColumns={[
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
        exportRows={bookings.map((booking) => ({
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
              <th className={bulkCheckboxHeadClass}>
                <BulkSelectAllCheckbox selection={selection} />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Booking
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Official name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
              <th className={dateColHeadClass}>Period</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b hover:bg-muted/30">
                <td className={bulkCheckboxCellClass}>
                  <BulkRowCheckbox id={booking.id} selection={selection} />
                </td>
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
  );
}
