import { Injectable } from "@nestjs/common";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";

export interface ReconcileResult {
  clean: boolean;
  residual: number;
}

/**
 * The proof behind an erasure report: after the destroyers run, asks each one to
 * count identifiable PII still present for the subject. RETAINED categories keep
 * data lawfully and report 0, so a non-zero total means a genuine leak — the
 * request is failed rather than falsely marked complete.
 */
@Injectable()
export class Reconciler {
  constructor(private readonly registry: DestroyerRegistry) {}

  public async scan(subjectId: string): Promise<ReconcileResult> {
    let residual = 0;
    for (const destroyer of this.registry.ordered()) {
      residual += await destroyer.verifyResidual(subjectId);
    }
    return { clean: residual === 0, residual };
  }
}
