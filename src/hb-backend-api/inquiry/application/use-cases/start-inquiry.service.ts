import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { AnimalId } from "src/hb-backend-api/animal/domain/model/vo/animal-id.vo";
import { AnimalQueryPort } from "src/hb-backend-api/animal/domain/ports/out/animal-query.port";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { PostMessageUseCase } from "src/hb-backend-api/messaging/domain/ports/in/post-message.use-case";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { UserQueryPort } from "src/hb-backend-api/user/domain/ports/out/user-query.port";
import { Inquiry } from "src/hb-backend-api/inquiry/domain/model/inquiry";
import {
  StartInquiryCommand,
  StartInquiryResult,
  StartInquiryUseCase,
} from "src/hb-backend-api/inquiry/domain/ports/in/start-inquiry.use-case";
import { InquiryPersistencePort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-persistence.port";
import { InquiryQueryPort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-query.port";

/**
 * Opens or reuses the inquirer's thread with the animal's shelter, then posts
 * the first message through the shared messaging use-case. Intentionally NOT
 * transactional: the message subject resolver reads the inquiry without the
 * ambient session, so the inquiry must be committed before the message is posted
 * (create-then-post). A repeat inquiry on the same animal reuses the thread.
 */
@Injectable()
export class StartInquiryService implements StartInquiryUseCase {
  constructor(
    @Inject(DIToken.AnimalModule.AnimalQueryPort)
    private readonly animalQueryPort: AnimalQueryPort,
    @Inject(DIToken.UserModule.UserQueryPort)
    private readonly userQueryPort: UserQueryPort,
    @Inject(DIToken.InquiryModule.InquiryQueryPort)
    private readonly inquiryQueryPort: InquiryQueryPort,
    @Inject(DIToken.InquiryModule.InquiryPersistencePort)
    private readonly inquiryPersistencePort: InquiryPersistencePort,
    @Inject(DIToken.MessagingModule.PostMessageUseCase)
    private readonly postMessageUseCase: PostMessageUseCase,
  ) {}

  public async invoke(
    command: StartInquiryCommand,
  ): Promise<StartInquiryResult> {
    const animalId = AnimalId.fromString(command.animalId);
    const animal = await this.animalQueryPort.findById(animalId);
    if (!animal) {
      throw new NotFoundException("동물을 찾을 수 없어요.");
    }

    const inquirerId = UserId.fromString(command.inquirerId);
    const inquirer = await this.userQueryPort.findById(inquirerId);
    if (!inquirer || !inquirer.isActive()) {
      throw new ForbiddenException("활성 회원만 문의할 수 있어요.");
    }

    const existing = await this.inquiryQueryPort.findByInquirerAndAnimal(
      inquirerId,
      animalId,
    );
    let inquiry = existing;
    if (!inquiry) {
      inquiry = Inquiry.open({
        shelterId: animal.getShelterId,
        inquirerId,
        animalId,
      });
      await this.inquiryPersistencePort.create(inquiry);
    }

    await this.postMessageUseCase.invoke({
      subjectType: MessageSubjectType.INQUIRY,
      subjectRef: inquiry.getId.toString(),
      senderId: command.inquirerId,
      body: command.message,
    });

    return { inquiryId: inquiry.getId.toString() };
  }
}
