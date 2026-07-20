import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { EditBookingDialog } from "@/components/bookings/edit-booking-dialog";
import { BookingStatusButtons } from "@/components/bookings/booking-status-buttons";
import { ConfirmBookingButton } from "@/components/bookings/confirm-booking-button";
import type { Booking, BookingStatus } from "@/lib/types";
import { BOOKING_STATUS_LABELS, getAccountDisplayName } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, account:accounts(id, name, nickname), deal:deals(id, title, stage)")
    .eq("id", id)
    .single();

  if (!booking) notFound();

  const { data: offers } = await supabase
    .from("deals")
    .select("id, title")
    .eq("account_id", booking.account_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/bookings" className="text-sm text-muted-foreground hover:text-primary">
            &larr; Back to bookings
          </Link>
          <div className="mt-2">
            <h1 className="text-3xl font-bold">{booking.title}</h1>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant={
                  booking.status === "active"
                    ? "success"
                    : booking.status === "option"
                      ? "warning"
                      : booking.status === "draft"
                        ? "warning"
                        : "secondary"
                }
              >
                {BOOKING_STATUS_LABELS[booking.status as BookingStatus] ?? booking.status}
              </Badge>
              <Link
                href={`/accounts/${(booking.account as { id: string }).id}`}
                className="text-sm text-primary hover:underline"
              >
                {getAccountDisplayName(
                  booking.account as { name?: string; nickname?: string }
                )}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(booking.needs_confirmation || booking.status === "draft") && (
            <ConfirmBookingButton
              booking={
                {
                  ...booking,
                  needs_confirmation: Boolean(booking.needs_confirmation),
                } as Booking
              }
              dealStage={
                (booking.deal as { stage?: string } | null)?.stage as
                  | "proposal"
                  | "negotiation"
                  | "won"
                  | "completed"
                  | undefined
              }
            />
          )}
          <EditBookingDialog
            booking={
              {
                ...booking,
                needs_confirmation: Boolean(booking.needs_confirmation),
              } as Booking
            }
            offers={offers || []}
          />
        </div>
      </div>

      {(booking.needs_confirmation || booking.status === "draft") && booking.deal_id && (
        <Card>
          <CardContent className="p-4 text-sm text-amber-800 dark:text-amber-300">
            This booking was created from an offer and still needs confirmation
            (dates and status).
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-medium">Update status</p>
          <BookingStatusButtons
            bookingId={booking.id}
            currentStatus={booking.status as BookingStatus}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(Number(booking.value), booking.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="text-2xl font-bold">{formatDate(booking.start_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">End Date</p>
            <p className="text-2xl font-bold">
              {booking.end_date ? formatDate(booking.end_date) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {booking.deal && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Linked Offer</p>
            <Link
              href={`/deals/${(booking.deal as { id: string }).id}`}
              className="text-lg font-medium text-primary hover:underline"
            >
              {(booking.deal as { title: string }).title}
            </Link>
          </CardContent>
        </Card>
      )}

      {booking.notes && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium">Notes</p>
            <p className="mt-2 text-muted-foreground">{booking.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
