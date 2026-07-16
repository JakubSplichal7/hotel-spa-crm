"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  ACCOUNT_TYPES,
  ACCOUNT_STATUSES,
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_STATUS_LABELS,
} from "@/lib/types";
import type { Profile } from "@/lib/types";

export function AccountFilters({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/accounts?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search clients..."
        defaultValue={searchParams.get("q") || ""}
        className="max-w-xs"
        onChange={(e) => updateFilter("q", e.target.value)}
      />
      <NativeSelect
        className="w-[160px]"
        defaultValue={searchParams.get("type") || "all"}
        onChange={(e) => updateFilter("type", e.target.value)}
      >
        <option value="all">All types</option>
        {ACCOUNT_TYPES.map((t) => (
          <option key={t} value={t}>
            {ACCOUNT_TYPE_LABELS[t]}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        className="w-[160px]"
        defaultValue={searchParams.get("status") || "all"}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        <option value="all">All statuses</option>
        {ACCOUNT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ACCOUNT_STATUS_LABELS[s]}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        className="w-[140px]"
        defaultValue={searchParams.get("vip") || "all"}
        onChange={(e) => updateFilter("vip", e.target.value)}
      >
        <option value="all">All clients</option>
        <option value="yes">VIP only</option>
      </NativeSelect>
      {profiles.length > 1 && (
        <NativeSelect
          className="w-[180px]"
          defaultValue={searchParams.get("owner") || "all"}
          onChange={(e) => updateFilter("owner", e.target.value)}
        >
          <option value="all">All managers</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </NativeSelect>
      )}
    </div>
  );
}
