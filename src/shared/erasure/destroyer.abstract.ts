import { ErasureContext } from "src/shared/erasure/erasure-context";
import { ErasureReceipt } from "src/shared/erasure/erasure-receipt";
import { RetentionRule } from "src/shared/erasure/retention-rule";

/** What a disposition did — returned by {@link Destroyer.doErase}. */
export interface DisposalResult {
  affected: number;
  retained: number;
  note?: string | null;
}

/**
 * One per (module, category). The public {@link erase} is a FINAL template
 * method: it runs the subclass disposition and wraps the counts in a uniform
 * receipt, so no destroyer can forget to report. Subclasses fill only:
 *
 *  - {@link doErase}         — apply the disposition. MUST be idempotent
 *    (re-running on an already-erased subject returns affected: 0), because the
 *    engine retries failed categories and resumes after a crash.
 *  - {@link verifyResidual}  — count identifiable PII still present for the
 *    subject (0 = clean). RETAINED categories keep data lawfully, so the default
 *    reports 0 and they never fail reconciliation.
 *
 * `priority` fixes a deterministic run order — lower first. Identity is erased
 * last (high number) so content that references the user goes first. `key` is a
 * stable, unique identifier (e.g. "user.identity") used to bind a persisted
 * erasure task to its destroyer across retries/restarts — category alone is not
 * unique (several modules may share ENGAGEMENT).
 */
export abstract class Destroyer {
  public abstract readonly key: string;
  public abstract readonly rule: RetentionRule;
  public abstract readonly priority: number;

  public async erase(
    subjectId: string,
    ctx: ErasureContext,
  ): Promise<ErasureReceipt> {
    const { affected, retained, note } = await this.doErase(subjectId, ctx);
    return ErasureReceipt.of({
      category: this.rule.category,
      disposition: this.rule.disposition,
      affected,
      retained,
      note,
    });
  }

  protected abstract doErase(
    subjectId: string,
    ctx: ErasureContext,
  ): Promise<DisposalResult>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public verifyResidual(subjectId: string): Promise<number> {
    return Promise.resolve(0);
  }
}
