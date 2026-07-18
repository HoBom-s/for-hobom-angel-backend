import { ErasureReceipt } from "src/shared/erasure/erasure-receipt";

/**
 * The DSAR evidence artifact: everything that happened when a subject was erased.
 * Built from the per-category receipts; the totals make the report self-summing.
 */
export class ErasureReport {
  private constructor(
    public readonly subjectId: string,
    public readonly actorId: string,
    public readonly reason: string | null,
    public readonly receipts: ErasureReceipt[],
    public readonly totalAffected: number,
    public readonly totalRetained: number,
  ) {}

  public static of(
    subjectId: string,
    actorId: string,
    reason: string | null,
    receipts: ErasureReceipt[],
  ): ErasureReport {
    const totalAffected = receipts.reduce((sum, r) => sum + r.affected, 0);
    const totalRetained = receipts.reduce((sum, r) => sum + r.retained, 0);
    return new ErasureReport(
      subjectId,
      actorId,
      reason,
      receipts,
      totalAffected,
      totalRetained,
    );
  }
}
