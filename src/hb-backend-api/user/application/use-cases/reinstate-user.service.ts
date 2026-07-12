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
  ReinstateUserCommand,
  ReinstateUserUseCase,
} from "src/hb-backend-api/user/domain/ports/in/reinstate-user.use-case";

/** Lifts a suspension (operator only), clearing the sanction and reactivating. */
@Injectable()
export class ReinstateUserService implements ReinstateUserUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: ReinstateUserCommand): Promise<void> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 제재를 해제할 수 있어요.");
    }

    const target = await this.userQueryPort.findById(
      UserId.fromString(command.userId),
    );
    if (!target) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }

    target.reinstate();
    await this.userPersistencePort.save(target);
  }
}
