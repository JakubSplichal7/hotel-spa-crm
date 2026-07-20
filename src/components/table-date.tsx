import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

/** Narrow date column — keeps table width down on mobile (1–2 lines). */
export const dateColHeadClass =
  "w-[4.75rem] max-w-[4.75rem] px-2 py-3 text-left text-sm font-medium sm:w-[6.5rem] sm:max-w-[6.5rem] sm:px-4";

export const dateColCellClass =
  "w-[4.75rem] max-w-[4.75rem] px-2 py-3 text-sm leading-tight text-muted-foreground sm:w-[6.5rem] sm:max-w-[6.5rem] sm:px-4";

function partsFromDate(date: string | Date | null | undefined) {
  if (!date) return null;
  let d: Date;
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, day] = date.slice(0, 10).split("-").map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = new Date(date);
  }
  if (Number.isNaN(d.getTime())) return null;
  return {
    line1: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(d),
    line2: String(d.getFullYear()),
  };
}

/** Renders date as two short lines: "Jul 24" / "2026" */
export function CompactDate({
  value,
  className,
}: {
  value: string | Date | null | undefined;
  className?: string;
}) {
  const parts = partsFromDate(value);
  if (!parts) return <span className={className}>—</span>;
  return (
    <span className={cn("block leading-tight", className)}>
      <span className="block whitespace-nowrap">{parts.line1}</span>
      <span className="block whitespace-nowrap">{parts.line2}</span>
    </span>
  );
}

/** Date+time as two short lines: "Jul 24 '26" / "3:00 PM" */
export function CompactDateTime({
  value,
  className,
}: {
  value: string | Date | null | undefined;
  className?: string;
}) {
  if (!value) return <span className={className}>—</span>;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return <span className={className}>{formatDateTime(value)}</span>;
  }
  const yy = String(d.getFullYear()).slice(-2);
  const line1 = `${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d)} '${yy}`;
  const line2 = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
  return (
    <span className={cn("block leading-tight", className)}>
      <span className="block whitespace-nowrap">{line1}</span>
      <span className="block whitespace-nowrap">{line2}</span>
    </span>
  );
}

/** Start–end as at most two short lines */
export function CompactDateRange({
  start,
  end,
  className,
}: {
  start: string | null | undefined;
  end?: string | null | undefined;
  className?: string;
}) {
  const s = partsFromDate(start);
  const e = partsFromDate(end);
  if (!s && !e) return <span className={className}>—</span>;
  if (!e) return <CompactDate value={start} className={className} />;
  if (!s) return <CompactDate value={end} className={className} />;

  const sameYear = s.line2 === e.line2;
  return (
    <span className={cn("block leading-tight", className)}>
      {sameYear ? (
        <>
          <span className="block whitespace-nowrap">{s.line1} –</span>
          <span className="block whitespace-nowrap">{e.line1}</span>
        </>
      ) : (
        <>
          <span className="block whitespace-nowrap">
            {s.line1} &apos;{s.line2.slice(-2)}
          </span>
          <span className="block whitespace-nowrap">
            – {e.line1} &apos;{e.line2.slice(-2)}
          </span>
        </>
      )}
    </span>
  );
}
