import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { ShelterModule } from "src/hb-backend-api/shelter/shelter.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { AnnouncementEntity } from "src/hb-backend-api/announcement/domain/model/announcement.entity";
import { AnnouncementSchema } from "src/hb-backend-api/announcement/domain/model/announcement.schema";
import { AnnouncementRepositoryImpl } from "src/hb-backend-api/announcement/infra/repositories/announcement.repository.impl";
import { AnnouncementPersistenceAdapter } from "src/hb-backend-api/announcement/adapters/out/announcement-persistence.adapter";
import { AnnouncementQueryAdapter } from "src/hb-backend-api/announcement/adapters/out/announcement-query.adapter";
import { PostAnnouncementService } from "src/hb-backend-api/announcement/application/use-cases/post-announcement.service";
import { EditAnnouncementService } from "src/hb-backend-api/announcement/application/use-cases/edit-announcement.service";
import { DeleteAnnouncementService } from "src/hb-backend-api/announcement/application/use-cases/delete-announcement.service";
import { AnnouncementController } from "src/hb-backend-api/announcement/adapters/in/announcement.controller";

/**
 * Shelter CMS — self-service notices (공지사항) a verified shelter's staff
 * publish to its page. Depends on ShelterModule (verified gate) and UserModule
 * (staff authorization). FAQ and the shelter intro are separate CMS slices.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnnouncementEntity.name, schema: AnnouncementSchema },
    ]),
    ShelterModule,
    UserModule,
  ],
  controllers: [AnnouncementController],
  providers: [
    {
      provide: DIToken.AnnouncementModule.PostAnnouncementUseCase,
      useClass: PostAnnouncementService,
    },
    {
      provide: DIToken.AnnouncementModule.EditAnnouncementUseCase,
      useClass: EditAnnouncementService,
    },
    {
      provide: DIToken.AnnouncementModule.DeleteAnnouncementUseCase,
      useClass: DeleteAnnouncementService,
    },
    {
      provide: DIToken.AnnouncementModule.AnnouncementRepository,
      useClass: AnnouncementRepositoryImpl,
    },
    {
      provide: DIToken.AnnouncementModule.AnnouncementPersistencePort,
      useClass: AnnouncementPersistenceAdapter,
    },
    {
      provide: DIToken.AnnouncementModule.AnnouncementQueryPort,
      useClass: AnnouncementQueryAdapter,
    },
  ],
})
export class AnnouncementModule {}
