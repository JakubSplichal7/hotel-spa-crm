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

export function todayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type TaskDayDelta = {
  /** Signed day count for display */
  days: number;
  /** True when past due (open) or completed after due (done) */
  late: boolean;
};

/**
 * Open tasks: due − today → +1 = one day left (green), negative = overdue (red).
 * Done tasks: done − due → +1 = one day late (red), ≤0 = on time/early (green).
 */
export function getTaskDayDelta(task: {
  due_at?: string | null;
  completed_at?: string | null;
  status?: string;
}): TaskDayDelta | null {
  if (!task.due_at) return null;

  if (task.status === "done") {
    if (!task.completed_at) return null;
    const days = daysBetweenDates(task.due_at, task.completed_at);
    return { days, late: days > 0 };
  }

  // Open (or any not-done): compare due vs today
  const days = daysBetweenDates(todayDateString(), task.due_at);
  return { days, late: days < 0 };
}

export function formatCompletionDelta(days: number): string {
  if (days === 0) return "0 days";
  if (days > 0) return `+${days} day${days === 1 ? "" : "s"}`;
  const early = Math.abs(days);
  return `−${early} day${early === 1 ? "" : "s"}`;
}

/** @deprecated use getTaskDayDelta */
export function taskCompletionDeltaDays(
  dueAt: string | null | undefined,
  completedAt: string | null | undefined
): number | null {
  if (!dueAt || !completedAt) return null;
  return daysBetweenDates(dueAt, completedAt);
}
