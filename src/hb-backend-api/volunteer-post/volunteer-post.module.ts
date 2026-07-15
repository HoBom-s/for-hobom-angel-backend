import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { VolunteerPostSchema } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.schema";
import { VolunteerPostController } from "src/hb-backend-api/volunteer-post/adapters/in/volunteer-post.controller";
import { VolunteerPostPersistenceAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-persistence.adapter";
import { VolunteerPostQueryAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-query.adapter";
import { VolunteerPostRepositoryImpl } from "src/hb-backend-api/volunteer-post/infra/repositories/volunteer-post.repository.impl";
import { CreateVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/create-volunteer-post.service";
import { DeleteVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/delete-volunteer-post.service";

/**
 * §05 volunteer review/promo feed. Member-authored posts, independent of the
 * volunteer event lifecycle — needs only User (author validation). Likes,
 * comments, and bookmarks are a follow-up slice.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VolunteerPostEntity.name, schema: VolunteerPostSchema },
    ]),
    UserModule,
  ],
  controllers: [VolunteerPostController],
  providers: [
    {
      provide: DIToken.VolunteerPostModule.CreateVolunteerPostUseCase,
      useClass: CreateVolunteerPostService,
    },
    {
      provide: DIToken.VolunteerPostModule.DeleteVolunteerPostUseCase,
      useClass: DeleteVolunteerPostService,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostRepository,
      useClass: VolunteerPostRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostPersistencePort,
      useClass: VolunteerPostPersistenceAdapter,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostQueryPort,
      useClass: VolunteerPostQueryAdapter,
    },
  ],
})
export class VolunteerPostModule {}
