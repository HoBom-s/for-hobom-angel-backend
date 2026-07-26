import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerPostId } from "src/hb-backend-api/volunteer-post/domain/model/vo/volunteer-post-id.vo";
import {
  DeleteVolunteerPostCommand,
  DeleteVolunteerPostUseCase,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/delete-volunteer-post.use-case";
import { VolunteerPostPersistencePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-persistence.port";
import { VolunteerPostQueryPort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-query.port";

/** The author removes their own post; a platform operator may moderate any. */
@Injectable()
export class DeleteVolunteerPostService implements DeleteVolunteerPostUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostQueryPort)
    private readonly queryPort: VolunteerPostQueryPort,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostPersistencePort)
    private readonly persistencePort: VolunteerPostPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: DeleteVolunteerPostCommand): Promise<void> {
    const post = await this.queryPort.findById(
      VolunteerPostId.fromString(command.postId),
    );
    if (!post) {
      throw new NotFoundException("후기를 찾을 수 없어요.");
    }

    const requesterId = UserId.fromString(command.requesterId);
    if (!post.isAuthoredBy(requesterId)) {
      const actor = await this.userQueryPort.findById(requesterId);
      if (!actor?.isPlatformAdmin()) {
        throw new ForbiddenException("본인 후기만 삭제할 수 있어요.");
      }
    }

    await this.persistencePort.remove(post);
  }
}
