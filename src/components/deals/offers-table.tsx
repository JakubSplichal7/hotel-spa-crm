"use client";

import { DeleteDealButton } from "@/components/deals/delete-deal-button";
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
import {
  CompactDate,
  dateColCellClass,
  dateColHeadClass,
} from "@/components/table-date";
import {
  getAccountDisplayName,
  getDealStageLabel,
  offerBookingHealthLabel,
  DEAL_STAGE_LABELS,
  BOOKING_STATUS_LABELS,
  type Booking,
  type BookingStatus,
  type Deal,
  type DealStage,
  type OfferBookingHealth,
} from "@/lib/types";
import { deleteDeals } from "@/lib/actions/deals";
import Link from "next/link";

function stageBadgeVariant(stage: string) {
  if (stage === "won") return "success" as const;
  if (stage === "completed") return "success" as const;
  if (stage === "lost") return "destructive" as const;
  if (stage === "proposal" || stage === "negotiation") return "warning" as const;
  return "secondary" as const;
}

export type OfferTableRow = {
  deal: Deal;
  booking: Booking | null;
  health: OfferBookingHealth;
};

export function OffersTable({ rows }: { rows: OfferTableRow[] }) {
  const selection = useBulkSelection(rows.map((r) => r.deal.id));

  return (
    <div>
      <BulkTableToolbar
        selection={selection}
        entityLabel="offer"
        onDelete={deleteDeals}
        exportFilename="offers"
        exportColumns={[
          "Offer",
          "Client",
          "Official name",
          "Stage",
          "Value",
          "Currency",
          "Expected close",
          "Booking",
          "Booking status",
          "Owner",
        ]}
        exportRows={rows.map(({ deal, booking, health }) => ({
          Offer: deal.title,
          Client: getAccountDisplayName(
            deal.account as { name?: string; nickname?: string } | null
          ),
          "Official name":
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
        })}
      />
      <div className="overflow-x-auto rounded-lg border bg-card/95 shadow-sm backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className={bulkCheckboxHeadClass}>
                <BulkSelectAllCheckbox selection={selection} />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Offer</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Official name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Stage</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
              <th className={dateColHeadClass}>Close</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Booking</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
              <th className="w-12 px-2 py-3 text-right text-sm font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ deal, booking, health }) => (
              <tr key={deal.id} className="border-b hover:bg-muted/30">
                <td className={bulkCheckboxCellClass}>
                  <BulkRowCheckbox id={deal.id} selection={selection} />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {deal.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">
                  {(deal.account as
                    | { id?: string; name?: string; nickname?: string }
                    | null)?.id ? (
                    <Link
                      href={`/accounts/${(deal.account as { id: string }).id}`}
                      className="hover:underline"
                    >
                      {getAccountDisplayName(
                        deal.account as { name?: string; nickname?: string }
                      )}
                    </Link>
                  ) : (
                    getAccountDisplayName(
                      deal.account as {
                        name?: string;
                        nickname?: string;
                      } | null
                    ) || "—"
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {(deal.account as { name?: string } | null)?.name || "—"}
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
                  {(deal.owner as { full_name: string } | null)?.full_name ||
                    "—"}
                </td>
                <td className="px-2 py-3 text-right">
                  <DeleteDealButton dealId={deal.id} dealTitle={deal.title} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
