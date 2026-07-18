import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ErasureContext } from "src/shared/erasure/erasure-context";
import { RetentionRule } from "src/shared/erasure/retention-rule";

class TestDestroyer extends Destroyer {
  public readonly key = "test.destroyer";
  public readonly priority = 1;
  public readonly rule: RetentionRule = {
    category: DataCategory.IDENTITY,
    disposition: Disposition.ANONYMIZE,
    legalBasis: "test",
  };
  constructor(private readonly result: DisposalResult) {
    super();
  }
  protected doErase(): Promise<DisposalResult> {
    return Promise.resolve(this.result);
  }
}

const ctx = ErasureContext.of("actor", null);

describe("Destroyer (template method)", () => {
  it("wraps doErase counts in a receipt stamped with the rule", async () => {
    const receipt = await new TestDestroyer({ affected: 3, retained: 1 }).erase(
      "subject",
      ctx,
    );
    expect(receipt.category).toBe(DataCategory.IDENTITY);
    expect(receipt.disposition).toBe(Disposition.ANONYMIZE);
    expect(receipt.affected).toBe(3);
    expect(receipt.retained).toBe(1);
  });

  it("defaults verifyResidual to 0 (clean) unless overridden", async () => {
    const residual = await new TestDestroyer({
      affected: 0,
      retained: 0,
    }).verifyResidual("subject");
    expect(residual).toBe(0);
  });
});
