import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { Reconciler } from "src/shared/erasure/reconciler";
import { RetentionRule } from "src/shared/erasure/retention-rule";

class Stub extends Destroyer {
  public readonly rule: RetentionRule = {
    category: DataCategory.SOCIAL,
    disposition: Disposition.ANONYMIZE,
    legalBasis: "test",
  };
  constructor(
    public readonly key: string,
    public readonly priority: number,
    private readonly residual: number,
  ) {
    super();
  }
  protected doErase(): Promise<DisposalResult> {
    return Promise.resolve({ affected: 0, retained: 0 });
  }
  public verifyResidual(): Promise<number> {
    return Promise.resolve(this.residual);
  }
}

describe("Reconciler", () => {
  const build = (residuals: number[]) => {
    const registry = new DestroyerRegistry();
    residuals.forEach((r, i) => registry.register(new Stub(`k${i}`, i, r)));
    return new Reconciler(registry);
  };

  it("is clean when every destroyer reports zero residual", async () => {
    expect(await build([0, 0, 0]).scan("subject")).toEqual({
      clean: true,
      residual: 0,
    });
  });

  it("is dirty (and sums) when any residual PII remains", async () => {
    expect(await build([0, 2, 1]).scan("subject")).toEqual({
      clean: false,
      residual: 3,
    });
  });
});
