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
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  SanctionUserCommand,
  SanctionUserUseCase,
} from "src/hb-backend-api/user/domain/ports/in/sanction-user.use-case";

/**
 * Suspends a member as a report-enforcement action. Operator-only; operators
 * cannot be sanctioned (prevents self/admin lockout). A suspended member's
 * `isActive()` is false, so the existing gates block them everywhere.
 */
@Injectable()
export class SanctionUserService implements SanctionUserUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: SanctionUserCommand): Promise<void> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 계정을 제재할 수 있어요.");
    }

    const target = await this.userQueryPort.findById(
      UserId.fromString(command.userId),
    );
    if (!target) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }
    if (target.isPlatformAdmin()) {
      throw new ForbiddenException("운영자는 제재할 수 없어요.");
    }

    target.suspend(command.reason, new Date());
    await this.userPersistencePort.save(target);
  }
}
