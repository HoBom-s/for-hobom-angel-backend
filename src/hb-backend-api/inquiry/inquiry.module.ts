import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { AnimalModule } from "src/hb-backend-api/animal/animal.module";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { NotificationModule } from "src/hb-backend-api/notification/notification.module";
import { MessagingModule } from "src/hb-backend-api/messaging/messaging.module";
import { MessageSubjectResolverRegistry } from "src/hb-backend-api/messaging/application/message-subject-resolver.registry";
import { InquiryEntity } from "src/hb-backend-api/inquiry/domain/model/inquiry.entity";
import { InquirySchema } from "src/hb-backend-api/inquiry/domain/model/inquiry.schema";
import { InquiryController } from "src/hb-backend-api/inquiry/adapters/in/inquiry.controller";
import { StartInquiryService } from "src/hb-backend-api/inquiry/application/use-cases/start-inquiry.service";
import { ListMyInquiriesService } from "src/hb-backend-api/inquiry/application/use-cases/list-my-inquiries.service";
import { ListShelterInquiriesService } from "src/hb-backend-api/inquiry/application/use-cases/list-shelter-inquiries.service";
import { InquiryPersistenceAdapter } from "src/hb-backend-api/inquiry/adapters/out/inquiry-persistence.adapter";
import { InquiryQueryAdapter } from "src/hb-backend-api/inquiry/adapters/out/inquiry-query.adapter";
import { InquiryRepositoryImpl } from "src/hb-backend-api/inquiry/infra/repositories/inquiry.repository.impl";
import { InquiryMessageSubjectResolver } from "src/hb-backend-api/inquiry/application/inquiry-message-subject.resolver";

/**
 * General shelter inquiries ("보호소에 문의하기"). The Inquiry thread is the
 * identity; messages reuse the shared messaging domain via the INQUIRY subject
 * resolver, self-registered into {@link MessageSubjectResolverRegistry} on init
 * (the same plug-in pattern as adoption/foster).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InquiryEntity.name, schema: InquirySchema },
    ]),
    MessagingModule,
    AnimalModule,
    ShelterModule,
    UserModule,
    NotificationModule,
  ],
  controllers: [InquiryController],
  providers: [
    {
      provide: DIToken.InquiryModule.StartInquiryUseCase,
      useClass: StartInquiryService,
    },
    {
      provide: DIToken.InquiryModule.ListMyInquiriesUseCase,
      useClass: ListMyInquiriesService,
    },
    {
      provide: DIToken.InquiryModule.ListShelterInquiriesUseCase,
      useClass: ListShelterInquiriesService,
    },
    {
      provide: DIToken.InquiryModule.InquiryRepository,
      useClass: InquiryRepositoryImpl,
    },
    {
      provide: DIToken.InquiryModule.InquiryPersistencePort,
      useClass: InquiryPersistenceAdapter,
    },
    {
      provide: DIToken.InquiryModule.InquiryQueryPort,
      useClass: InquiryQueryAdapter,
    },
    InquiryMessageSubjectResolver,
  ],
})
export class InquiryModule implements OnModuleInit {
  constructor(
    private readonly resolverRegistry: MessageSubjectResolverRegistry,
    private readonly inquiryMessageSubjectResolver: InquiryMessageSubjectResolver,
  ) {}

  public onModuleInit(): void {
    this.resolverRegistry.register(this.inquiryMessageSubjectResolver);
  }
}
