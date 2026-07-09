import type { Recurrence } from "./types";
import { toYMD } from "./utils";

/** Add a recurrence interval to a YYYY-MM-DD date string. Returns YYYY-MM-DD. */
export function advanceDate(dateStr: string, rec: Recurrence): string {
  const d = new Date(dateStr + "T00:00:00");
  const n = Math.max(1, rec.every || 1);
  switch (rec.unit) {
    case "day":
      d.setDate(d.getDate() + n);
      break;
    case "week":
      d.setDate(d.getDate() + n * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + n);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + n);
      break;
  }
  return toYMD(d);
}

/**
 * Given a recurring thing's current date + recurrence, compute the next
 * occurrence date. Returns null when the recurrence end date has passed
 * (i.e. no further occurrences should be spawned).
 */
export function nextOccurrence(dateStr: string, rec: Recurrence): string | null {
  const next = advanceDate(dateStr, rec);
  if (rec.endDate && next > rec.endDate) return null;
  return next;
}
