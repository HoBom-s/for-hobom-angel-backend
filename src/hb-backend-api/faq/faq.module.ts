import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { FaqEntity } from "src/hb-backend-api/faq/domain/model/faq.entity";
import { FaqSchema } from "src/hb-backend-api/faq/domain/model/faq.schema";
import { FaqRepositoryImpl } from "src/hb-backend-api/faq/infra/repositories/faq.repository.impl";
import { FaqPersistenceAdapter } from "src/hb-backend-api/faq/adapters/out/faq-persistence.adapter";
import { FaqQueryAdapter } from "src/hb-backend-api/faq/adapters/out/faq-query.adapter";
import { PostFaqService } from "src/hb-backend-api/faq/application/use-cases/post-faq.service";
import { EditFaqService } from "src/hb-backend-api/faq/application/use-cases/edit-faq.service";
import { DeleteFaqService } from "src/hb-backend-api/faq/application/use-cases/delete-faq.service";
import { FaqController } from "src/hb-backend-api/faq/adapters/in/faq.controller";

/**
 * Shelter CMS — self-service FAQ a verified shelter's staff publish to its page.
 * Same operating gate as announcements (ShelterModule verified + UserModule
 * staff authorization); entries render in ascending `order`.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: FaqEntity.name, schema: FaqSchema }]),
    ShelterModule,
    UserModule,
  ],
  controllers: [FaqController],
  providers: [
    {
      provide: DIToken.FaqModule.PostFaqUseCase,
      useClass: PostFaqService,
    },
    {
      provide: DIToken.FaqModule.EditFaqUseCase,
      useClass: EditFaqService,
    },
    {
      provide: DIToken.FaqModule.DeleteFaqUseCase,
      useClass: DeleteFaqService,
    },
    {
      provide: DIToken.FaqModule.FaqRepository,
      useClass: FaqRepositoryImpl,
    },
    {
      provide: DIToken.FaqModule.FaqPersistencePort,
      useClass: FaqPersistenceAdapter,
    },
    {
      provide: DIToken.FaqModule.FaqQueryPort,
      useClass: FaqQueryAdapter,
    },
  ],
})
export class FaqModule {}
