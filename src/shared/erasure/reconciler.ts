import { Injectable } from "@nestjs/common";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { Disposition } from "src/shared/erasure/disposition.enum";

export interface ReconcileResult {
  clean: boolean;
  residual: number;
}

/**
 * The proof behind an erasure report. Only ANONYMIZE categories are scanned:
 * HARD_DELETE is self-verifying (its `deletedCount` is the evidence) and RETAIN
 * lawfully keeps data, so both would only add empty round-trips. The remaining
 * residual checks run in parallel — a non-zero total means a genuine leak, so
 * the request is failed rather than falsely marked complete.
 */
@Injectable()
export class Reconciler {
  constructor(private readonly registry: DestroyerRegistry) {}

  public async scan(subjectId: string): Promise<ReconcileResult> {
    const toVerify = this.registry
      .ordered()
      .filter((d) => d.rule.disposition === Disposition.ANONYMIZE);

    const residuals = await Promise.all(
      toVerify.map((d) => d.verifyResidual(subjectId)),
    );
    const residual = residuals.reduce((sum, count) => sum + count, 0);
    return { clean: residual === 0, residual };
  }
}
