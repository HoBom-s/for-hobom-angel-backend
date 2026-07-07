import { Test } from "@nestjs/testing";
import { DIToken } from "src/shared/di/token.di";
import { IdempotencyAdapter } from "src/hb-backend-api/idempotency/adapters/out/idempotency.adapter";

describe("IdempotencyAdapter", () => {
  it("delegates reserve to the repository", async () => {
    const repo = { reserve: jest.fn() };
    const module = await Test.createTestingModule({
      providers: [
        IdempotencyAdapter,
        {
          provide: DIToken.IdempotencyModule.IdempotencyRepository,
          useValue: repo,
        },
      ],
    }).compile();

    const adapter = module.get(IdempotencyAdapter);
    await adapter.reserve("adoption", "key-1");
    expect(repo.reserve).toHaveBeenCalledWith("adoption", "key-1");
  });
});
