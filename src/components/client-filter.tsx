"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NativeSelect } from "@/components/ui/native-select";
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
    <NativeSelect
      className="w-[220px]"
      value={current}
      onChange={(e) => updateFilter(e.target.value)}
      aria-label="Filter by client"
    >
      <option value="all">All clients</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name}
        </option>
      ))}
    </NativeSelect>
  );
}
