import { TokenRegistry } from "src/shared/di/token-registry.di";

/**
 * DI token catalogue. Grouped by module. Inject with `@Inject(DIToken.X.Y)`.
 *
 *   providers: [{ provide: DIToken.OutboxModule.OutboxPersistencePort, useClass: OutboxPersistenceAdapter }]
 *   constructor(@Inject(DIToken.OutboxModule.OutboxPersistencePort) private readonly port: OutboxPersistencePort) {}
 */
class OutboxModuleToken extends TokenRegistry {
  public readonly OutboxPersistencePort = this.register(
    "outbox.persistence.port",
  );
  public readonly OutboxRepository = this.register("outbox.repository");
}

class UserModuleToken extends TokenRegistry {
  public readonly UserPersistencePort = this.register("user.persistence.port");
  public readonly UserQueryPort = this.register("user.query.port");
  public readonly UserRepository = this.register("user.repository");
}

class AuthModuleToken extends TokenRegistry {
  public readonly JwtAuthPort = this.register("auth.jwt.port");
  public readonly IssueTokenUseCase = this.register(
    "auth.issue-token.use-case",
  );
}

class AuditModuleToken extends TokenRegistry {
  public readonly AuditPersistencePort = this.register(
    "audit.persistence.port",
  );
  public readonly AuditRepository = this.register("audit.repository");
}

class IdempotencyModuleToken extends TokenRegistry {
  public readonly IdempotencyPort = this.register("idempotency.port");
  public readonly IdempotencyRepository = this.register(
    "idempotency.repository",
  );
}

export const DIToken = {
  OutboxModule: new OutboxModuleToken(),
  UserModule: new UserModuleToken(),
  AuthModule: new AuthModuleToken(),
  AuditModule: new AuditModuleToken(),
  IdempotencyModule: new IdempotencyModuleToken(),
} as const;
