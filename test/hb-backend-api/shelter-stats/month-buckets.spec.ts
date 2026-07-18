import { monthlyBuckets } from "src/hb-backend-api/shelter-stats/application/month-buckets";

describe("monthlyBuckets", () => {
  it("returns the last N KST months oldest-first, ending with now's month", () => {
    // 2026-07-15T00:00Z is 09:00 KST on Jul 15 → July is the current KST month.
    const buckets = monthlyBuckets(new Date("2026-07-15T00:00:00.000Z"), 6);
    expect(buckets.map((b) => b.month)).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });

  it("computes KST month boundaries as UTC instants (9h before UTC midnight)", () => {
    const buckets = monthlyBuckets(new Date("2026-07-15T00:00:00.000Z"), 6);
    const july = buckets[buckets.length - 1];
    // KST Jul 1 00:00 == UTC Jun 30 15:00; KST Aug 1 00:00 == UTC Jul 31 15:00.
    expect(july.from.toISOString()).toBe("2026-06-30T15:00:00.000Z");
    expect(july.to.toISOString()).toBe("2026-07-31T15:00:00.000Z");
  });

  it("crosses the year boundary correctly", () => {
    const buckets = monthlyBuckets(new Date("2026-01-10T12:00:00.000Z"), 6);
    expect(buckets.map((b) => b.month)).toEqual([
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
  });

  it("treats the last KST hours of a UTC month as the next KST month", () => {
    // 2026-06-30T15:30Z == 2026-07-01 00:30 KST → belongs to July, not June.
    const buckets = monthlyBuckets(new Date("2026-06-30T15:30:00.000Z"), 1);
    expect(buckets[0].month).toBe("2026-07");
  });
});
