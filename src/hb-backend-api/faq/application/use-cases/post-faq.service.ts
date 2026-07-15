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
import { ShelterQueryPort } from "src/hb-backend-api/shelter/domain/ports/out/shelter-query.port";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Faq } from "src/hb-backend-api/faq/domain/model/faq";
import { FaqPersistencePort } from "src/hb-backend-api/faq/domain/ports/out/faq-persistence.port";
import {
  PostFaqCommand,
  PostFaqResult,
  PostFaqUseCase,
} from "src/hb-backend-api/faq/domain/ports/in/post-faq.use-case";

/**
 * Adds a FAQ entry to a shelter's page. The shelter must be VERIFIED and the
 * actor must be its staff/admin — the shelter-owned-content operating gate.
 */
@Injectable()
export class PostFaqService implements PostFaqUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.ShelterModule.ShelterQueryPort)
    private readonly shelterQueryPort: ShelterQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.FaqModule.FaqPersistencePort)
    private readonly faqPersistencePort: FaqPersistencePort,
  ) {}

  @Transactional()
  public async invoke(command: PostFaqCommand): Promise<PostFaqResult> {
    const shelterId = ShelterId.fromString(command.shelterId);

    const shelter = await this.shelterQueryPort.findById(shelterId);
    if (!shelter) {
      throw new NotFoundException("보호소를 찾을 수 없어요.");
    }
    if (!shelter.isVerified()) {
      throw new ForbiddenException("검증된 보호소만 FAQ를 등록할 수 있어요.");
    }

    const actor = await this.userQueryPort.findById(
      UserId.fromString(command.authorId),
    );
    if (!actor || !actor.canManageShelter(shelterId)) {
      throw new ForbiddenException("보호소 담당자만 FAQ를 등록할 수 있어요.");
    }

    const faq = Faq.post({
      shelterId,
      authorId: actor.getId,
      question: command.question,
      answer: command.answer,
      order: command.order,
    });
    await this.faqPersistencePort.create(faq);

    return { faqId: faq.getId.toString() };
  }
}
