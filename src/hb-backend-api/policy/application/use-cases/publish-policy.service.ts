import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { PolicyDocument } from "src/hb-backend-api/policy/domain/model/policy-document";
import { PolicyPersistencePort } from "src/hb-backend-api/policy/domain/ports/out/policy-persistence.port";
import { PolicyQueryPort } from "src/hb-backend-api/policy/domain/ports/out/policy-query.port";
import {
  PublishPolicyCommand,
  PublishPolicyUseCase,
} from "src/hb-backend-api/policy/domain/ports/in/publish-policy.use-case";

/**
 * Operator publishes a new version of a policy document. The previous published
 * version is archived and the new one inserted in one transaction, so exactly
 * one version is ever in effect. `(type, version)` is unique — a concurrent
 * double-publish loses on the index rather than creating two "current" versions.
 */
@Injectable()
export class PublishPolicyService implements PublishPolicyUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.PolicyModule.PolicyPersistencePort)
    private readonly persistencePort: PolicyPersistencePort,
    @Inject(DIToken.PolicyModule.PolicyQueryPort)
    private readonly queryPort: PolicyQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: PublishPolicyCommand): Promise<PolicyDocument> {
    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.actorId),
    );
    if (!actor?.isPlatformAdmin()) {
      throw new ForbiddenException("운영자만 정책을 게시할 수 있어요.");
    }

    const effectiveDate = this.resolveEffectiveDate(command.effectiveDate);
    const version = await this.queryPort.nextVersion(command.type);
    const document = PolicyDocument.publish({
      type: command.type,
      version,
      title: command.title,
      content: command.content,
      effectiveDate,
      now: new Date(),
    });

    await this.persistencePort.archiveCurrent(command.type);
    return this.persistencePort.save(document);
  }

  private resolveEffectiveDate(raw?: string): Date {
    if (!raw) {
      return new Date();
    }
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("effectiveDate 형식이 올바르지 않아요.");
    }
    return date;
  }
}
