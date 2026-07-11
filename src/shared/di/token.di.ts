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
  public readonly RefreshTokenRepository = this.register(
    "auth.refresh-token.repository",
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

class ApprovalModuleToken extends TokenRegistry {
  public readonly SubmitApprovalUseCase = this.register(
    "approval.submit.use-case",
  );
  public readonly DecideApprovalUseCase = this.register(
    "approval.decide.use-case",
  );
  public readonly ApprovalPersistencePort = this.register(
    "approval.persistence.port",
  );
  public readonly ApprovalQueryPort = this.register("approval.query.port");
  public readonly ApprovalRepository = this.register("approval.repository");
}

class ShelterModuleToken extends TokenRegistry {
  public readonly RegisterShelterUseCase = this.register(
    "shelter.register.use-case",
  );
  public readonly RequestStaffPromotionUseCase = this.register(
    "shelter.request-staff-promotion.use-case",
  );
  public readonly ShelterPersistencePort = this.register(
    "shelter.persistence.port",
  );
  public readonly ShelterQueryPort = this.register("shelter.query.port");
  public readonly ShelterRepository = this.register("shelter.repository");
  public readonly PublicShelterDataPort = this.register(
    "shelter.public-data.port",
  );
  public readonly BusinessRegistryPort = this.register(
    "shelter.business-registry.port",
  );
}

class AnimalModuleToken extends TokenRegistry {
  public readonly RegisterAnimalUseCase = this.register(
    "animal.register.use-case",
  );
  public readonly UpdateAnimalProfileUseCase = this.register(
    "animal.update-profile.use-case",
  );
  public readonly AnimalPersistencePort = this.register(
    "animal.persistence.port",
  );
  public readonly AnimalQueryPort = this.register("animal.query.port");
  public readonly AnimalRepository = this.register("animal.repository");
}

class AdoptionModuleToken extends TokenRegistry {
  public readonly DefineAdoptionQuestionnaireUseCase = this.register(
    "adoption.define-questionnaire.use-case",
  );
  public readonly SubmitAdoptionApplicationUseCase = this.register(
    "adoption.submit-application.use-case",
  );
  public readonly AdoptionQuestionnairePersistencePort = this.register(
    "adoption.questionnaire.persistence.port",
  );
  public readonly AdoptionQuestionnaireQueryPort = this.register(
    "adoption.questionnaire.query.port",
  );
  public readonly AdoptionQuestionnaireRepository = this.register(
    "adoption.questionnaire.repository",
  );
  public readonly AdoptionApplicationPersistencePort = this.register(
    "adoption.application.persistence.port",
  );
  public readonly AdoptionApplicationQueryPort = this.register(
    "adoption.application.query.port",
  );
  public readonly AdoptionApplicationRepository = this.register(
    "adoption.application.repository",
  );
}

export const DIToken = {
  OutboxModule: new OutboxModuleToken(),
  UserModule: new UserModuleToken(),
  AuthModule: new AuthModuleToken(),
  AuditModule: new AuditModuleToken(),
  IdempotencyModule: new IdempotencyModuleToken(),
  ApprovalModule: new ApprovalModuleToken(),
  ShelterModule: new ShelterModuleToken(),
  AnimalModule: new AnimalModuleToken(),
  AdoptionModule: new AdoptionModuleToken(),
} as const;
