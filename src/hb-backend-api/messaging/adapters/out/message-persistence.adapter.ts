import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";
import { MessagePersistencePort } from "src/hb-backend-api/messaging/domain/ports/out/message-persistence.port";
import { MessageRepository } from "src/hb-backend-api/messaging/domain/repositories/message.repository";
import { toInsertDoc } from "src/hb-backend-api/messaging/adapters/out/message.mapper";

@Injectable()
export class MessagePersistenceAdapter implements MessagePersistencePort {
  constructor(
    @Inject(DIToken.MessagingModule.MessageRepository)
    private readonly repository: MessageRepository,
  ) {}

  public async create(message: Message): Promise<void> {
    await this.repository.insert(toInsertDoc(message));
  }
}
