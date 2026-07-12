import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";
import { MessageQueryPort } from "src/hb-backend-api/messaging/domain/ports/out/message-query.port";
import { MessageRepository } from "src/hb-backend-api/messaging/domain/repositories/message.repository";
import { toDomain } from "src/hb-backend-api/messaging/adapters/out/message.mapper";

@Injectable()
export class MessageQueryAdapter implements MessageQueryPort {
  constructor(
    @Inject(DIToken.MessagingModule.MessageRepository)
    private readonly repository: MessageRepository,
  ) {}

  public async listBySubject(
    subjectType: MessageSubjectType,
    subjectRef: string,
  ): Promise<Message[]> {
    const docs = await this.repository.findBySubject(subjectType, subjectRef);
    return docs.map(toDomain);
  }
}
