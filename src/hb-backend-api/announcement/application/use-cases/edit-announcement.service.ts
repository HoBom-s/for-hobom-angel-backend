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
  EditAnnouncementCommand,
  EditAnnouncementUseCase,
} from "src/hb-backend-api/announcement/domain/ports/in/edit-announcement.use-case";

/** Edits a notice — any staff/admin of the owning shelter may do so. */
@Injectable()
export class EditAnnouncementService implements EditAnnouncementUseCase {
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
  public async invoke(command: EditAnnouncementCommand): Promise<void> {
    const announcement = await this.announcementQueryPort.findById(
      AnnouncementId.fromString(command.announcementId),
    );
    if (!announcement) {
      throw new NotFoundException("공지를 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.editorId),
    );
    if (!actor || !actor.canManageShelter(announcement.getShelterId)) {
      throw new ForbiddenException("보호소 담당자만 공지를 수정할 수 있어요.");
    }

    announcement.edit({
      title: command.title,
      body: command.body,
      pinned: command.pinned,
    });
    await this.announcementPersistencePort.save(announcement);
  }
}
