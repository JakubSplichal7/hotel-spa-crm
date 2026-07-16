import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: PageProps) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, account:accounts(id, name), deal:deals(id, title)")
    .eq("id", id)
    .single();

  if (!booking) notFound();

  return (
    <div className="space-y-6">
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
                  : booking.status === "draft"
                  ? "warning"
                  : "secondary"
              }
            >
              {booking.status}
            </Badge>
            <Link
              href={`/accounts/${(booking.account as { id: string }).id}`}
              className="text-sm text-primary hover:underline"
            >
              {(booking.account as { name: string }).name}
            </Link>
          </div>
        </div>
      </div>

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
            <p className="text-sm text-muted-foreground">Linked Deal</p>
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
