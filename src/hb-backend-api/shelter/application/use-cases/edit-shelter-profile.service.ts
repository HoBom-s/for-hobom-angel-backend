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
import {
  EditShelterProfileCommand,
  EditShelterProfileUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/edit-shelter-profile.use-case";
import { ShelterPersistencePort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-persistence.port";
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";

/**
 * Edits a shelter's public About content (§07). Only the shelter's own
 * staff/admin may edit; the change is version-guarded so concurrent edits don't
 * silently clobber each other.
 */
@Injectable()
export class EditShelterProfileService implements EditShelterProfileUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.ShelterModule.ShelterPersistencePort)
    private readonly shelterPersistencePort: ShelterPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: EditShelterProfileCommand): Promise<void> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const editor = await this.userQueryPort.findById(
      UserId.fromString(command.editorId),
    );
    if (!editor || !editor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 스태프만 소개를 수정할 수 있어요.");
    }

    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }

    shelter.editProfile({
      intro: command.intro,
      operatingSince: command.operatingSince,
      representativeName: command.representativeName,
      visitGuide: command.visitGuide,
      supportGuide: command.supportGuide,
      coverImageKey: command.coverImageKey,
    });
    await this.shelterPersistencePort.save(shelter);
  }
}
