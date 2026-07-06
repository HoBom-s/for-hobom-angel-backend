import { DIToken } from "src/shared/di/token.di";

describe("DIToken", () => {
  it("exposes a unique symbol per binding", () => {
    const tokens = [
      DIToken.OutboxModule.OutboxPersistencePort,
      DIToken.OutboxModule.OutboxRepository,
      DIToken.UserModule.UserPersistencePort,
      DIToken.UserModule.UserQueryPort,
      DIToken.UserModule.UserRepository,
      DIToken.AuthModule.JwtAuthPort,
      DIToken.AuthModule.IssueTokenUseCase,
    ];
    tokens.forEach((t) => expect(typeof t).toBe("symbol"));
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});
