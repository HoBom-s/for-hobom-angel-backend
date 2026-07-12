import {
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
import { Announcement } from "src/hb-backend-api/announcement/domain/model/announcement";
import { AnnouncementPersistencePort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-persistence.port";
import {
  PostAnnouncementCommand,
  PostAnnouncementResult,
  PostAnnouncementUseCase,
} from "src/hb-backend-api/announcement/domain/ports/in/post-announcement.use-case";

/**
 * Publishes a notice to a shelter's page. The shelter must be VERIFIED (it has a
 * public presence) and the actor must be its staff/admin — the same operating
 * gate used across shelter-owned content.
 */
@Injectable()
export class PostAnnouncementService implements PostAnnouncementUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.AnnouncementModule.AnnouncementPersistencePort)
    private readonly announcementPersistencePort: AnnouncementPersistencePort,
  ) {}

  @Transactional()
  public async invoke(
    command: PostAnnouncementCommand,
  ): Promise<PostAnnouncementResult> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    if (!shelter.isVerified()) {
      throw new ForbiddenException("검증된 보호소만 공지를 올릴 수 있어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.authorId),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 담당자만 공지를 올릴 수 있어요.");
    }

    const announcement = Announcement.post({
      shelterId,
      authorId: actor.getId,
      title: command.title,
      body: command.body,
      pinned: command.pinned,
    });
    await this.announcementPersistencePort.create(announcement);

    return { announcementId: announcement.getId.toString() };
  }
}
