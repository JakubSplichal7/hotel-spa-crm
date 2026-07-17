/** Calendar day helpers for task due / completed dates (YYYY-MM-DD). */

export function daysBetweenDates(from: string, to: string): number {
  const a = from.slice(0, 10);
  const b = to.slice(0, 10);
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const start = Date.UTC(ay, am - 1, ad);
  const end = Date.UTC(by, bm - 1, bd);
  return Math.round((end - start) / (24 * 60 * 60 * 1000));
}

/** Days from due to done: positive = late, 0 = on time, negative = early */
export function taskCompletionDeltaDays(
  dueAt: string | null | undefined,
  completedAt: string | null | undefined
): number | null {
  if (!dueAt || !completedAt) return null;
  return daysBetweenDates(dueAt, completedAt);
}

export function formatCompletionDelta(days: number): string {
  if (days === 0) return "0 days";
  if (days > 0) return `+${days} day${days === 1 ? "" : "s"}`;
  const early = Math.abs(days);
  return `−${early} day${early === 1 ? "" : "s"}`;
}
