import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";
import { MessageQueryPort } from "src/hb-backend-api/messaging/domain/ports/out/message-query.port";
import {
  ListConversationMessagesQuery,
  ListConversationMessagesUseCase,
} from "src/hb-backend-api/messaging/domain/ports/in/list-conversation-messages.use-case";
import { ConversationAccessService } from "src/hb-backend-api/messaging/application/conversation-access.service";

/**
 * Lists a conversation's messages in order, after checking the reader is a
 * participant.
 */
@Injectable()
export class ListConversationMessagesService implements ListConversationMessagesUseCase {
  constructor(
    @Inject(DIToken.MessagingModule.MessageQueryPort)
    private readonly messageQueryPort: MessageQueryPort,
    private readonly access: ConversationAccessService,
  ) {}

  public async invoke(
    query: ListConversationMessagesQuery,
  ): Promise<Message[]> {
    await this.access.authorize(
      query.subjectType,
      query.subjectRef,
      query.readerId,
    );
    return this.messageQueryPort.listBySubject(
      query.subjectType,
      query.subjectRef,
    );
  }
}
