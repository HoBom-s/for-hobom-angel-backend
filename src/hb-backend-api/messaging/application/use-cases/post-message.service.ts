import { Inject, Injectable } from "@nestjs/common";
import { Transactional } from "src/infra/mongo/transaction/transaction.decorator";
import { TransactionRunner } from "src/infra/mongo/transaction/transaction.runner";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";
import { MessagePersistencePort } from "src/hb-backend-api/messaging/domain/ports/out/message-persistence.port";
import {
  PostMessageCommand,
  PostMessageResult,
  PostMessageUseCase,
} from "src/hb-backend-api/messaging/domain/ports/in/post-message.use-case";
import { ConversationAccessService } from "src/hb-backend-api/messaging/application/conversation-access.service";

/**
 * Posts a message to an application's conversation. Authorizes the sender as the
 * applicant or the shelter's staff/admin, stamps the resolved side, and appends
 * the message — in a transaction so a future arrival notification can commit with
 * it.
 */
@Injectable()
export class PostMessageService implements PostMessageUseCase {
  constructor(
    public readonly transactionRunner: TransactionRunner,
    @Inject(DIToken.MessagingModule.MessagePersistencePort)
    private readonly messagePersistencePort: MessagePersistencePort,
    private readonly access: ConversationAccessService,
  ) {}

  @Transactional()
  public async invoke(command: PostMessageCommand): Promise<PostMessageResult> {
    const senderRole = await this.access.authorize(
      command.subjectType,
      command.subjectRef,
      command.senderId,
    );

    const message = Message.write({
      subjectType: command.subjectType,
      subjectRef: command.subjectRef,
      senderId: UserId.fromString(command.senderId),
      senderRole,
      body: command.body,
    });
    await this.messagePersistencePort.create(message);

    return { messageId: message.getId.toString() };
  }
}
