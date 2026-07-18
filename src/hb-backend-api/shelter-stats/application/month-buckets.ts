/** KST (Asia/Seoul, UTC+9) — the product is Korea-only, so months are KST months. */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface MonthBucket {
  /** "YYYY-MM" in KST. */
  month: string;
  /** UTC instant of the KST month start (inclusive). */
  from: Date;
  /** UTC instant of the next KST month start (exclusive). */
  to: Date;
}

/**
 * The last `count` KST calendar months ending with the one containing `now`,
 * oldest first. Boundaries are returned as UTC instants so they can be compared
 * directly against stored UTC timestamps — a KST month "starts" 9 hours before
 * UTC midnight.
 */
export function monthlyBuckets(now: Date, count: number): MonthBucket[] {
  const shifted = new Date(now.getTime() + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();

  const buckets: MonthBucket[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const startWall = Date.UTC(year, month - offset, 1);
    const endWall = Date.UTC(year, month - offset + 1, 1);
    const label = new Date(startWall);
    buckets.push({
      month: `${label.getUTCFullYear()}-${String(label.getUTCMonth() + 1).padStart(2, "0")}`,
      from: new Date(startWall - KST_OFFSET_MS),
      to: new Date(endWall - KST_OFFSET_MS),
    });
  }
  return buckets;
}
