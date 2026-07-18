import { DataCategory } from "src/shared/erasure/data-category.enum";
import { Disposition } from "src/shared/erasure/disposition.enum";
import { ErasureContext } from "src/shared/erasure/erasure-context";
import { CredentialsDestroyer } from "src/hb-backend-api/auth/adapters/erasure/credentials.destroyer";

describe("CredentialsDestroyer", () => {
  const ctx = ErasureContext.of("actor", null);

  const build = (deleted: number, remaining: number) => {
    const repo = {
      create: jest.fn(),
      findByJti: jest.fn(),
      markRotated: jest.fn(),
      revokeFamily: jest.fn(),
      deleteByUserId: jest.fn().mockResolvedValue(deleted),
      countByUserId: jest.fn().mockResolvedValue(remaining),
    };
    return { destroyer: new CredentialsDestroyer(repo), repo };
  };

  it("hard-deletes every session and reports the count", async () => {
    const { destroyer, repo } = build(3, 0);
    const receipt = await destroyer.erase("user-1", ctx);

    expect(repo.deleteByUserId).toHaveBeenCalledWith("user-1");
    expect(receipt.category).toBe(DataCategory.CREDENTIALS);
    expect(receipt.disposition).toBe(Disposition.HARD_DELETE);
    expect(receipt.affected).toBe(3);
  });

  it("reports remaining sessions as residual", async () => {
    const { destroyer } = build(0, 0);
    expect(await destroyer.verifyResidual("user-1")).toBe(0);
  });
});
