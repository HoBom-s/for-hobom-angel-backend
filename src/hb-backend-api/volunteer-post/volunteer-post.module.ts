import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { VolunteerPostEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.entity";
import { VolunteerPostSchema } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post.schema";
import { VolunteerPostLikeEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-like.entity";
import { VolunteerPostLikeSchema } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-like.schema";
import { VolunteerPostCommentEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.entity";
import { VolunteerPostCommentSchema } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-comment.schema";
import { VolunteerPostBookmarkEntity } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-bookmark.entity";
import { VolunteerPostBookmarkSchema } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post-bookmark.schema";
import { VolunteerPostController } from "src/hb-backend-api/volunteer-post/adapters/in/volunteer-post.controller";
import { MyBookmarksController } from "src/hb-backend-api/volunteer-post/adapters/in/my-bookmarks.controller";
import { VolunteerPostPersistenceAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-persistence.adapter";
import { VolunteerPostQueryAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-query.adapter";
import { VolunteerPostLikeAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-like.adapter";
import { VolunteerPostCommentAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-comment.adapter";
import { VolunteerPostBookmarkAdapter } from "src/hb-backend-api/volunteer-post/adapters/out/volunteer-post-bookmark.adapter";
import { VolunteerPostRepositoryImpl } from "src/hb-backend-api/volunteer-post/infra/repositories/volunteer-post.repository.impl";
import { VolunteerPostLikeRepositoryImpl } from "src/hb-backend-api/volunteer-post/infra/repositories/volunteer-post-like.repository.impl";
import { VolunteerPostCommentRepositoryImpl } from "src/hb-backend-api/volunteer-post/infra/repositories/volunteer-post-comment.repository.impl";
import { VolunteerPostBookmarkRepositoryImpl } from "src/hb-backend-api/volunteer-post/infra/repositories/volunteer-post-bookmark.repository.impl";
import { CreateVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/create-volunteer-post.service";
import { DeleteVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/delete-volunteer-post.service";
import { LikeVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/like-volunteer-post.service";
import { ReadVolunteerFeedService } from "src/hb-backend-api/volunteer-post/application/use-cases/read-volunteer-feed.service";
import { CommentVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/comment-volunteer-post.service";
import { BookmarkVolunteerPostService } from "src/hb-backend-api/volunteer-post/application/use-cases/bookmark-volunteer-post.service";
import { ListMyBookmarksService } from "src/hb-backend-api/volunteer-post/application/use-cases/list-my-bookmarks.service";

/**
 * §05 volunteer review/promo feed. Member-authored posts (independent of the
 * volunteer event lifecycle) with likes. Comments and bookmarks are follow-ups.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VolunteerPostEntity.name, schema: VolunteerPostSchema },
      { name: VolunteerPostLikeEntity.name, schema: VolunteerPostLikeSchema },
      {
        name: VolunteerPostCommentEntity.name,
        schema: VolunteerPostCommentSchema,
      },
      {
        name: VolunteerPostBookmarkEntity.name,
        schema: VolunteerPostBookmarkSchema,
      },
    ]),
    UserModule,
  ],
  controllers: [VolunteerPostController, MyBookmarksController],
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
      provide: DIToken.VolunteerPostModule.LikeVolunteerPostUseCase,
      useClass: LikeVolunteerPostService,
    },
    {
      provide: DIToken.VolunteerPostModule.ReadVolunteerFeedUseCase,
      useClass: ReadVolunteerFeedService,
    },
    {
      provide: DIToken.VolunteerPostModule.CommentVolunteerPostUseCase,
      useClass: CommentVolunteerPostService,
    },
    {
      provide: DIToken.VolunteerPostModule.BookmarkVolunteerPostUseCase,
      useClass: BookmarkVolunteerPostService,
    },
    {
      provide: DIToken.VolunteerPostModule.ListMyBookmarksUseCase,
      useClass: ListMyBookmarksService,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostRepository,
      useClass: VolunteerPostRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostLikeRepository,
      useClass: VolunteerPostLikeRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostCommentRepository,
      useClass: VolunteerPostCommentRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostBookmarkRepository,
      useClass: VolunteerPostBookmarkRepositoryImpl,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostPersistencePort,
      useClass: VolunteerPostPersistenceAdapter,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostQueryPort,
      useClass: VolunteerPostQueryAdapter,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostLikePort,
      useClass: VolunteerPostLikeAdapter,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostCommentPort,
      useClass: VolunteerPostCommentAdapter,
    },
    {
      provide: DIToken.VolunteerPostModule.VolunteerPostBookmarkPort,
      useClass: VolunteerPostBookmarkAdapter,
    },
  ],
})
export class VolunteerPostModule {}
