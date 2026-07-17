"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchableClientSelect } from "@/components/searchable-client-select";
import type { Account } from "@/lib/types";

export function ClientFilter({
  accounts,
  basePath,
}: {
  accounts: Account[];
  basePath: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("client") || "all";

  function updateFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("client", value);
    } else {
      params.delete("client");
    }
    const query = params.toString();
    router.push(query ? `${basePath}?${query}` : basePath);
  }

  return (
    <SearchableClientSelect
      accounts={accounts}
      value={current}
      onChange={updateFilter}
      allowAll
      allLabel="All clients"
      placeholder="Type client name…"
      className="max-w-xs"
    />
  );
}
