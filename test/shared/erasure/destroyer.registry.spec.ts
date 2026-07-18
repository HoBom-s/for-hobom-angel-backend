import { DataCategory } from "src/shared/erasure/data-category.enum";
import {
  Destroyer,
  DisposalResult,
} from "src/shared/erasure/destroyer.abstract";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
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
  ) {
    super();
  }
  protected doErase(): Promise<DisposalResult> {
    return Promise.resolve({ affected: 0, retained: 0 });
  }
}

describe("DestroyerRegistry", () => {
  it("orders destroyers by priority (ascending)", () => {
    const registry = new DestroyerRegistry();
    registry.register(new Stub("late", 100));
    registry.register(new Stub("early", 10));
    expect(registry.ordered().map((d) => d.key)).toEqual(["early", "late"]);
  });

  it("looks a destroyer up by key", () => {
    const registry = new DestroyerRegistry();
    const stub = new Stub("a", 1);
    registry.register(stub);
    expect(registry.byKey("a")).toBe(stub);
    expect(() => registry.byKey("missing")).toThrow("Destroyer");
  });

  it("rejects a duplicate key", () => {
    const registry = new DestroyerRegistry();
    registry.register(new Stub("dup", 1));
    expect(() => registry.register(new Stub("dup", 2))).toThrow("중복");
  });
});
