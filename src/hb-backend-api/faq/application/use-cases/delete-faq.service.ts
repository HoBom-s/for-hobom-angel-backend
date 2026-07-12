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
import { FaqId } from "src/hb-backend-api/faq/domain/model/vo/faq-id.vo";
import { FaqPersistencePort } from "src/hb-backend-api/faq/domain/ports/out/faq-persistence.port";
import { FaqQueryPort } from "src/hb-backend-api/faq/domain/ports/out/faq-query.port";
import {
  DeleteFaqCommand,
  DeleteFaqUseCase,
} from "src/hb-backend-api/faq/domain/ports/in/delete-faq.use-case";

/**
 * Removes a FAQ entry. Staff/admin of the owning shelter may delete their own;
 * a platform operator may remove any (moderation).
 */
@Injectable()
export class DeleteFaqService implements DeleteFaqUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.FaqModule.FaqQueryPort)
    private readonly faqQueryPort: FaqQueryPort,
    @Inject(DIToken.FaqModule.FaqPersistencePort)
    private readonly faqPersistencePort: FaqPersistencePort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
  ) {}

  @Transactional()
  public async invoke(command: DeleteFaqCommand): Promise<void> {
    const faq = await this.faqQueryPort.findById(
      FaqId.fromString(command.faqId),
    );
    if (!faq) {
      throw new NotFoundException("FAQ를 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.requesterId),
    );
    const canModerate =
      actor?.canManageShelter(faq.getShelterId) || actor?.isPlatformAdmin();
    if (!canModerate) {
      throw new ForbiddenException("보호소 담당자만 FAQ를 삭제할 수 있어요.");
    }

    await this.faqPersistencePort.remove(faq);
  }
}
