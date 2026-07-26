import { Types } from "mongoose";
import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ErasureContext } from "src/shared/erasure/erasure-context";
import { IdentityDestroyer } from "src/hb-backend-api/user/adapters/erasure/identity.destroyer";

describe("IdentityDestroyer", () => {
  const subjectId = new Types.ObjectId().toString();
  const ctx = ErasureContext.of("actor", null);

  const build = (anonymized: number, residual: number) => {
    const personalData = {
      read: jest.fn(),
      anonymize: jest.fn().mockResolvedValue(anonymized),
      countResidual: jest.fn().mockResolvedValue(residual),
    };
    return { destroyer: new IdentityDestroyer(personalData), personalData };
  };

  it("anonymizes IDENTITY in place and reports the row affected", async () => {
    const { destroyer, personalData } = build(1, 0);
    const receipt = await destroyer.erase(subjectId, ctx);

    expect(personalData.anonymize).toHaveBeenCalledTimes(1);
    expect(receipt.category).toBe(DataCategory.IDENTITY);
    expect(receipt.disposition).toBe(Disposition.ANONYMIZE);
    expect(receipt.affected).toBe(1);
  });

  it("verifies residual PII via the port", async () => {
    const { destroyer } = build(0, 0);
    expect(await destroyer.verifyResidual(subjectId)).toBe(0);
  });
});
