import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  GetLatestMessagesUseCase,
  LatestMessage,
} from "src/hb-backend-api/messaging/domain/ports/in/get-latest-messages.use-case";
import { MessageQueryPort } from "src/hb-backend-api/messaging/domain/ports/out/message-query.port";

@Injectable()
export class GetLatestMessagesService implements GetLatestMessagesUseCase {
  constructor(
    @Inject(DIToken.MessagingModule.MessageQueryPort)
    private readonly messageQueryPort: MessageQueryPort,
  ) {}

  public async invoke(
    subjectType: MessageSubjectType,
    subjectRefs: string[],
  ): Promise<LatestMessage[]> {
    const messages = await this.messageQueryPort.findLatestBySubjects(
      subjectType,
      subjectRefs,
    );
    return messages.map((message) => ({
      subjectRef: message.getSubjectRef,
      body: message.getBody,
      senderRole: message.getSenderRole,
      sentAt: message.getSentAt,
    }));
  }
}
