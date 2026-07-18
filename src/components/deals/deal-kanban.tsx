"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateDealStage } from "@/lib/actions/deals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  getOfferBookingHealth,
  offerBookingHealthLabel,
  type Booking,
  type Deal,
  type DealStage,
} from "@/lib/types";

const OPEN_STAGES = DEAL_STAGES.filter(
  (s) => s !== "won" && s !== "completed" && s !== "lost"
);

type DealWithBooking = Deal & { booking?: Booking | null };

export function DealKanban({ deals }: { deals: DealWithBooking[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStageChange(deal: DealWithBooking, stage: DealStage) {
    if (stage === deal.stage) return;
    setLoading(true);
    await updateDealStage(deal.id, stage);
    setLoading(false);
    router.refresh();
  }

  const dealsByStage = OPEN_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = deals.filter((d) => d.stage === stage);
      return acc;
    },
    {} as Record<DealStage, DealWithBooking[]>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {OPEN_STAGES.map((stage) => (
        <div key={stage} className="min-w-[280px] flex-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{DEAL_STAGE_LABELS[stage]}</h3>
            <Badge variant="secondary">
              {dealsByStage[stage]?.length || 0}
            </Badge>
          </div>
          <div className="space-y-2">
            {(dealsByStage[stage] || []).map((deal) => {
              const health = getOfferBookingHealth(deal.stage, deal.booking, {
                booking_create_declined: deal.booking_create_declined,
                active_booking_declined: deal.active_booking_declined,
                completed_booking_declined: deal.completed_booking_declined,
              });
              return (
                <Card key={deal.id} className="cursor-pointer hover:shadow-md">
                  <CardContent className="p-4">
                    <Link href={`/deals/${deal.id}`}>
                      <p className="font-medium">{deal.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {(deal.account as { name: string } | undefined)?.name}
                      </p>
                      <p className="mt-2 font-semibold text-primary">
                        {formatCurrency(Number(deal.value), deal.currency)}
                      </p>
                      {deal.expected_close && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Close: {formatDate(deal.expected_close)}
                        </p>
                      )}
                      {health !== "ok" && (
                        <Badge variant="warning" className="mt-2">
                          {offerBookingHealthLabel(health)}
                        </Badge>
                      )}
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {OPEN_STAGES.filter((s) => s !== stage).map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={loading}
                          onClick={() => handleStageChange(deal, s)}
                          className="rounded bg-muted px-2 py-0.5 text-xs hover:bg-accent disabled:opacity-50"
                          title={`Move to ${DEAL_STAGE_LABELS[s]}`}
                        >
                          {DEAL_STAGE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
