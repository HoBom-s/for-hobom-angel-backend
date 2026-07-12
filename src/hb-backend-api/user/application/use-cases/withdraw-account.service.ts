import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserPersistencePort } from "src/hb-backend-api/user/domain/ports/out/user-persistence.port";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import {
  WithdrawAccountCommand,
  WithdrawAccountUseCase,
} from "src/hb-backend-api/user/domain/ports/in/withdraw-account.use-case";

/** Days the withdrawn account is retained before PII is purged (legal window). */
const PII_PURGE_GRACE_DAYS = 30;

/**
 * Soft-withdraws the caller: status -> WITHDRAWN and a purge deadline is stamped.
 * A scheduled purge (separate follow-up) hard-deletes PII after the grace period.
 */
@Injectable()
export class WithdrawAccountService implements WithdrawAccountUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.UserModule.UserPersistencePort)
    private readonly userPersistencePort: UserPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: WithdrawAccountCommand): Promise<void> {
    const user = await this.userQueryPort.findById(
      UserId.fromString(command.userId),
    );
    if (!user) {
      throw new NotFoundException("회원을 찾을 수 없어요.");
    }

    const now = new Date();
    const purgeAfter = new Date(now);
    purgeAfter.setDate(purgeAfter.getDate() + PII_PURGE_GRACE_DAYS);

    user.withdraw(now, purgeAfter);
    await this.userPersistencePort.save(user);
  }
}
