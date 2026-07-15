import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import {
  CreateVolunteerPostCommand,
  CreateVolunteerPostResult,
  CreateVolunteerPostUseCase,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";
import { VolunteerPostPersistencePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-persistence.port";

/** Publishes a member's volunteer review post. Only active members may post. */
@Injectable()
export class CreateVolunteerPostService implements CreateVolunteerPostUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostPersistencePort)
    private readonly persistencePort: VolunteerPostPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(
    command: CreateVolunteerPostCommand,
  ): Promise<CreateVolunteerPostResult> {
    const author = await this.userQueryPort.findById(
      UserId.fromString(command.authorId),
    );
    if (!author || !author.isActive()) {
      throw new ForbiddenException("활성 회원만 후기를 쓸 수 있어요.");
    }

    const post = VolunteerPost.write({
      authorId: author.getId,
      eventId: command.eventId,
      body: command.body,
      imageKeys: command.imageKeys,
    });
    await this.persistencePort.create(post);

    return { postId: post.getId.toString() };
  }
}
