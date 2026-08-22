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
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  RemoveShelterStaffCommand,
  RemoveShelterStaffUseCase,
} from "src/hb-backend-api/shelter/domain/ports/in/remove-shelter-staff.use-case";

/**
 * Removes a member from a shelter's staff. Only a shelter admin may do it; the
 * target must currently be a staff member there (an admin isn't removable this
 * way). The revoked grant is persisted in one transaction.
 */
@Injectable()
export class RemoveShelterStaffService implements RemoveShelterStaffUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: RemoveShelterStaffCommand): Promise<void> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor || !actor.hasShelterRole(shelterId, UserRole.SHELTER_ADMIN)) {
      throw new ForbiddenException(
        "보호소 관리자만 스태프를 제거할 수 있어요.",
      );
    }

    const target = await this.userQueryPort.findById(
      UserId.fromString(command.targetUserId),
    );
    if (!target) {
      throw new NotFoundException("대상 회원을 찾을 수 없어요.");
    }
    if (!target.isShelterStaffMember(shelterId)) {
      throw new NotFoundException("해당 보호소의 스태프가 아니에요.");
    }

    target.revokeShelterStaff(shelterId);
    await this.userPersistencePort.save(target);
  }
}
