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
import { AnnouncementId } from "src/hb-backend-api/announcement/domain/model/vo/announcement-id.vo";
import { AnnouncementPersistencePort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-persistence.port";
import { AnnouncementQueryPort } from "src/hb-backend-api/announcement/domain/ports/out/announcement-query.port";
import {
  DeleteAnnouncementCommand,
  DeleteAnnouncementUseCase,
} from "src/hb-backend-api/announcement/domain/ports/in/delete-announcement.use-case";

/**
 * Removes a notice. Staff/admin of the owning shelter may delete their own;
 * a platform operator may remove any (moderation).
 */
@Injectable()
export class DeleteAnnouncementService implements DeleteAnnouncementUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.AnnouncementModule.AnnouncementQueryPort)
    private readonly announcementQueryPort: AnnouncementQueryPort,
    @Inject(DIToken.AnnouncementModule.AnnouncementPersistencePort)
    private readonly announcementPersistencePort: AnnouncementPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: DeleteAnnouncementCommand): Promise<void> {
    const announcement = await this.announcementQueryPort.findById(
      AnnouncementId.fromString(command.announcementId),
    );
    if (!announcement) {
      throw new NotFoundException("공지를 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.requesterId),
    );
    const canModerate =
      actor?.canManageShelter(announcement.getShelterId) ||
      actor?.isPlatformAdmin();
    if (!canModerate) {
      throw new ForbiddenException("보호소 담당자만 공지를 삭제할 수 있어요.");
    }

    await this.announcementPersistencePort.remove(announcement);
  }
}
