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
  public readonly OutboxQueryPort = this.register("outbox.query.port");
  public readonly OutboxRepository = this.register("outbox.repository");
  public readonly FindOutboxUseCase = this.register("outbox.find.use-case");
  public readonly MarkOutboxSentUseCase = this.register(
    "outbox.mark-sent.use-case",
  );
  public readonly MarkOutboxFailedUseCase = this.register(
    "outbox.mark-failed.use-case",
  );
}

class UserModuleToken extends TokenRegistry {
  public readonly UserPersistencePort = this.register("user.persistence.port");
  public readonly UserQueryPort = this.register("user.query.port");
  public readonly UserRepository = this.register("user.repository");
  public readonly ChangeNicknameUseCase = this.register(
    "user.change-nickname.use-case",
  );
  public readonly WithdrawAccountUseCase = this.register(
    "user.withdraw-account.use-case",
  );
  public readonly SanctionUserUseCase = this.register("user.sanction.use-case");
  public readonly ReinstateUserUseCase = this.register(
    "user.reinstate.use-case",
  );
}

class AuthModuleToken extends TokenRegistry {
  public readonly JwtAuthPort = this.register("auth.jwt.port");
  public readonly RefreshTokenRepository = this.register(
    "auth.refresh-token.repository",
  );
  public readonly SignUpUseCase = this.register("auth.sign-up.use-case");
  public readonly LoginUseCase = this.register("auth.login.use-case");
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
  public readonly RelistAnimalUseCase = this.register("animal.relist.use-case");
  public readonly SetAnimalBlindUseCase = this.register(
    "animal.set-blind.use-case",
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
  public readonly ReturnAdoptionUseCase = this.register(
    "adoption.return.use-case",
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
  public readonly ConvertFosterToAdoptionUseCase = this.register(
    "foster.convert-to-adoption.use-case",
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
  public readonly CloseExpiredVolunteerEventsUseCase = this.register(
    "volunteer.close-expired-events.use-case",
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

class FavoriteModuleToken extends TokenRegistry {
  public readonly AddFavoriteUseCase = this.register("favorite.add.use-case");
  public readonly RemoveFavoriteUseCase = this.register(
    "favorite.remove.use-case",
  );
  public readonly ListFavoritesUseCase = this.register(
    "favorite.list.use-case",
  );
  public readonly FavoritePersistencePort = this.register(
    "favorite.persistence.port",
  );
  public readonly FavoriteQueryPort = this.register("favorite.query.port");
  public readonly FavoriteRepository = this.register("favorite.repository");
}

class ReportModuleToken extends TokenRegistry {
  public readonly SubmitReportUseCase = this.register("report.submit.use-case");
  public readonly ResolveReportUseCase = this.register(
    "report.resolve.use-case",
  );
  public readonly ListPendingReportsUseCase = this.register(
    "report.list-pending.use-case",
  );
  public readonly ReportPersistencePort = this.register(
    "report.persistence.port",
  );
  public readonly ReportQueryPort = this.register("report.query.port");
  public readonly ReportRepository = this.register("report.repository");
}

class AnnouncementModuleToken extends TokenRegistry {
  public readonly PostAnnouncementUseCase = this.register(
    "announcement.post.use-case",
  );
  public readonly EditAnnouncementUseCase = this.register(
    "announcement.edit.use-case",
  );
  public readonly DeleteAnnouncementUseCase = this.register(
    "announcement.delete.use-case",
  );
  public readonly AnnouncementPersistencePort = this.register(
    "announcement.persistence.port",
  );
  public readonly AnnouncementQueryPort = this.register(
    "announcement.query.port",
  );
  public readonly AnnouncementRepository = this.register(
    "announcement.repository",
  );
}

class AdopterHistoryModuleToken extends TokenRegistry {
  public readonly GetAdopterHistoryUseCase = this.register(
    "adopter-history.get.use-case",
  );
}

class FaqModuleToken extends TokenRegistry {
  public readonly PostFaqUseCase = this.register("faq.post.use-case");
  public readonly EditFaqUseCase = this.register("faq.edit.use-case");
  public readonly DeleteFaqUseCase = this.register("faq.delete.use-case");
  public readonly FaqPersistencePort = this.register("faq.persistence.port");
  public readonly FaqQueryPort = this.register("faq.query.port");
  public readonly FaqRepository = this.register("faq.repository");
}

class ReviewModuleToken extends TokenRegistry {
  public readonly SubmitReviewUseCase = this.register("review.submit.use-case");
  public readonly ReviseReviewUseCase = this.register("review.revise.use-case");
  public readonly DeleteReviewUseCase = this.register("review.delete.use-case");
  public readonly ReviewPersistencePort = this.register(
    "review.persistence.port",
  );
  public readonly ReviewQueryPort = this.register("review.query.port");
  public readonly ReviewRepository = this.register("review.repository");
  public readonly PlacementEligibilityPort = this.register(
    "review.placement-eligibility.port",
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
  QuestionnaireModule: new QuestionnaireModuleToken(),
  AdoptionModule: new AdoptionModuleToken(),
  FosterModule: new FosterModuleToken(),
  VolunteerModule: new VolunteerModuleToken(),
  MessagingModule: new MessagingModuleToken(),
  FavoriteModule: new FavoriteModuleToken(),
  ReportModule: new ReportModuleToken(),
  ReviewModule: new ReviewModuleToken(),
  AnnouncementModule: new AnnouncementModuleToken(),
  FaqModule: new FaqModuleToken(),
  AdopterHistoryModule: new AdopterHistoryModuleToken(),
} as const;
