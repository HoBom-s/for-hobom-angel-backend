import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { Nickname } from "src/hb-backend-api/user/domain/model/vo/nickname.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  ChangeNicknameCommand,
  ChangeNicknameUseCase,
} from "src/hb-backend-api/user/domain/ports/in/change-nickname.use-case";

/**
 * Renames the caller. Uniqueness is checked here for a clean 409 and backed by
 * the collection's unique index (the real race guard). Renaming to the same
 * value is a no-op success.
 */
@Injectable()
export class ChangeNicknameService implements ChangeNicknameUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: ChangeNicknameCommand): Promise<void> {
    const user = await this.userQueryPort.findById(
      UserId.fromString(command.userId),
    );
    if (!user) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }

    const nickname = Nickname.of(command.nickname);
    const holder = await this.userQueryPort.findByNickname(nickname.raw);
    if (holder && !holder.getId.equals(user.getId)) {
      throw new ConflictException("이미 사용 중인 닉네임이에요.");
    }

    user.changeNickname(nickname);
    await this.userPersistencePort.save(user);
  }
}
