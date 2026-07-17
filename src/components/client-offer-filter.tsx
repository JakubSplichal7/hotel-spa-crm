"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { SearchableClientSelect } from "@/components/searchable-client-select";
import { Input } from "@/components/ui/input";
import type { Account } from "@/lib/types";

export type OfferOption = {
  id: string;
  title: string;
  account_id: string;
};

export function ClientOfferFilter({
  accounts,
  offers,
  basePath,
}: {
  accounts: Account[];
  offers: OfferOption[];
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client") || "all";
  const offerId = searchParams.get("offer") || "all";
  const clientSelected = Boolean(clientId && clientId !== "all");

  const clientOffers = useMemo(
    () =>
      clientSelected
        ? offers
            .filter((o) => o.account_id === clientId)
            .map((o) => ({ id: o.id, name: o.title }))
        : [],
    [offers, clientId, clientSelected]
  );

  const validOfferId =
    clientSelected && clientOffers.some((o) => o.id === offerId)
      ? offerId
      : "all";

  function pushParams(next: { client?: string; offer?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextClient = next.client !== undefined ? next.client : clientId;
    const nextOffer = next.offer !== undefined ? next.offer : offerId;

    if (nextClient && nextClient !== "all") {
      params.set("client", nextClient);
    } else {
      params.delete("client");
    }

    // Offer only applies when a client is selected
    if (nextClient && nextClient !== "all" && nextOffer && nextOffer !== "all") {
      const belongsToClient = offers.some(
        (o) => o.id === nextOffer && o.account_id === nextClient
      );
      if (belongsToClient) {
        params.set("offer", nextOffer);
      } else {
        params.delete("offer");
      }
    } else {
      params.delete("offer");
    }

    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <div className="flex flex-wrap gap-3 rounded-xl border border-white/70 bg-white/90 p-3 shadow-sm backdrop-blur-md">
      <SearchableClientSelect
        accounts={accounts}
        value={clientId}
        onChange={(value) => pushParams({ client: value, offer: "all" })}
        allowAll
        allLabel="All clients"
        placeholder="Type client name…"
        className="max-w-xs"
      />

      {clientSelected ? (
        <SearchableClientSelect
          accounts={clientOffers}
          value={validOfferId}
          onChange={(value) => pushParams({ offer: value })}
          name="offer_id"
          allowAll
          allLabel="All offers"
          placeholder="Type offer name…"
          className="max-w-xs"
          emptyLabel="No offers starting with"
        />
      ) : (
        <div className="relative w-full max-w-xs">
          <Input
            disabled
            readOnly
            value=""
            placeholder=""
            aria-label="Offer filter (select a client first)"
            className="bg-muted/40"
          />
        </div>
      )}
    </div>
  );
}
