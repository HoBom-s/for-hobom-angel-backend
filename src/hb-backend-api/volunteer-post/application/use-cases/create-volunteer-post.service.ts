import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { VolunteerPost } from "src/hb-backend-api/volunteer-post/domain/model/volunteer-post";
import {
  CreateVolunteerPostCommand,
  CreateVolunteerPostResult,
  CreateVolunteerPostUseCase,
} from "src/hb-backend-api/volunteer-post/domain/ports/in/create-volunteer-post.use-case";
import { VolunteerPostPersistencePort } from "src/hb-backend-api/volunteer-post/domain/ports/out/volunteer-post-persistence.port";

/**
 * Publishes a member's volunteer review. Only active members may post, and a
 * review must be about a real, VERIFIED shelter (the author picks which shelter
 * the review is for).
 */
@Injectable()
export class CreateVolunteerPostService implements CreateVolunteerPostUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.VolunteerPostModule.VolunteerPostPersistencePort)
    private readonly persistencePort: VolunteerPostPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
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

    const shelterId = ShelterId.fromString(command.shelterId);
    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    if (!shelter.isVerified()) {
      throw new BadRequestException("검증된 보호소에만 후기를 쓸 수 있어요.");
    }

    const post = VolunteerPost.write({
      authorId: author.getId,
      shelterId,
      eventId: command.eventId,
      content: command.content,
    });
    await this.persistencePort.create(post);

    return { postId: post.getId.toString() };
  }
}
