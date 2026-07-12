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
  EditFaqCommand,
  EditFaqUseCase,
} from "src/hb-backend-api/faq/domain/ports/in/edit-faq.use-case";

/** Edits a FAQ entry — any staff/admin of the owning shelter may do so. */
@Injectable()
export class EditFaqService implements EditFaqUseCase {
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
  public async invoke(command: EditFaqCommand): Promise<void> {
    const faq = await this.faqQueryPort.findById(
      FaqId.fromString(command.faqId),
    );
    if (!faq) {
      throw new NotFoundException("FAQ를 찾을 수 없어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.editorId),
    );
    if (!actor || !actor.canManageShelter(faq.getShelterId)) {
      throw new ForbiddenException("보호소 담당자만 FAQ를 수정할 수 있어요.");
    }

    faq.edit({
      question: command.question,
      answer: command.answer,
      order: command.order,
    });
    await this.faqPersistencePort.save(faq);
  }
}
