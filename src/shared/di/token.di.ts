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

class QuestionnaireModuleToken extends TokenRegistry {
  public readonly DefineQuestionnaireUseCase = this.register(
    "questionnaire.define.use-case",
  );
  public readonly QuestionnairePersistencePort = this.register(
    "questionnaire.persistence.port",
  );
  public readonly QuestionnaireQueryPort = this.register(
    "questionnaire.query.port",
  );
  public readonly QuestionnaireRepository = this.register(
    "questionnaire.repository",
  );
}

class AdoptionModuleToken extends TokenRegistry {
  public readonly SubmitAdoptionApplicationUseCase = this.register(
    "adoption.submit-application.use-case",
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

class FosterModuleToken extends TokenRegistry {
  public readonly SubmitFosterApplicationUseCase = this.register(
    "foster.submit-application.use-case",
  );
  public readonly TerminateFosterUseCase = this.register(
    "foster.terminate.use-case",
  );
  public readonly FosterApplicationPersistencePort = this.register(
    "foster.application.persistence.port",
  );
  public readonly FosterApplicationQueryPort = this.register(
    "foster.application.query.port",
  );
  public readonly FosterApplicationRepository = this.register(
    "foster.application.repository",
  );
}

class VolunteerModuleToken extends TokenRegistry {
  public readonly CreateVolunteerEventUseCase = this.register(
    "volunteer.create-event.use-case",
  );
  public readonly SignUpForVolunteerUseCase = this.register(
    "volunteer.sign-up.use-case",
  );
  public readonly WithdrawVolunteerSignupUseCase = this.register(
    "volunteer.withdraw-signup.use-case",
  );
  public readonly CancelVolunteerEventUseCase = this.register(
    "volunteer.cancel-event.use-case",
  );
  public readonly VolunteerEventPersistencePort = this.register(
    "volunteer.event.persistence.port",
  );
  public readonly VolunteerEventQueryPort = this.register(
    "volunteer.event.query.port",
  );
  public readonly VolunteerEventRepository = this.register(
    "volunteer.event.repository",
  );
  public readonly VolunteerSignupPersistencePort = this.register(
    "volunteer.signup.persistence.port",
  );
  public readonly VolunteerSignupQueryPort = this.register(
    "volunteer.signup.query.port",
  );
  public readonly VolunteerSignupRepository = this.register(
    "volunteer.signup.repository",
  );
}

class MessagingModuleToken extends TokenRegistry {
  public readonly PostMessageUseCase = this.register(
    "messaging.post-message.use-case",
  );
  public readonly ListConversationMessagesUseCase = this.register(
    "messaging.list-conversation-messages.use-case",
  );
  public readonly MessagePersistencePort = this.register(
    "messaging.persistence.port",
  );
  public readonly MessageQueryPort = this.register("messaging.query.port");
  public readonly MessageRepository = this.register("messaging.repository");
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
  QuestionnaireModule: new QuestionnaireModuleToken(),
  AdoptionModule: new AdoptionModuleToken(),
  FosterModule: new FosterModuleToken(),
  VolunteerModule: new VolunteerModuleToken(),
  MessagingModule: new MessagingModuleToken(),
} as const;
