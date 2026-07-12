import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";
import { MessageSchema } from "src/hb-backend-api/messaging/domain/model/message.schema";
import { MessagePersistenceAdapter } from "src/hb-backend-api/messaging/adapters/out/message-persistence.adapter";
import { MessageQueryAdapter } from "src/hb-backend-api/messaging/adapters/out/message-query.adapter";
import { MessageRepositoryImpl } from "src/hb-backend-api/messaging/infra/repositories/message.repository.impl";
import { MessageSubjectResolverRegistry } from "src/hb-backend-api/messaging/application/message-subject-resolver.registry";
import { ConversationAccessService } from "src/hb-backend-api/messaging/application/conversation-access.service";
import { PostMessageService } from "src/hb-backend-api/messaging/application/use-cases/post-message.service";
import { ListConversationMessagesService } from "src/hb-backend-api/messaging/application/use-cases/list-conversation-messages.service";
import { MessageController } from "src/hb-backend-api/messaging/adapters/in/message.controller";

/**
 * Messaging — conversations tied to an adoption/foster application. Messaging
 * stays ignorant of those domains: they register a participant resolver into the
 * exported {@link MessageSubjectResolverRegistry} (the approval-registry pattern),
 * and access is authorized fresh against the resolved participants.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageEntity.name, schema: MessageSchema },
    ]),
    UserModule,
  ],
  controllers: [MessageController],
  providers: [
    MessageSubjectResolverRegistry,
    ConversationAccessService,
    {
      provide: DIToken.MessagingModule.PostMessageUseCase,
      useClass: PostMessageService,
    },
    {
      provide: DIToken.MessagingModule.ListConversationMessagesUseCase,
      useClass: ListConversationMessagesService,
    },
    {
      provide: DIToken.MessagingModule.MessageRepository,
      useClass: MessageRepositoryImpl,
    },
    {
      provide: DIToken.MessagingModule.MessagePersistencePort,
      useClass: MessagePersistenceAdapter,
    },
    {
      provide: DIToken.MessagingModule.MessageQueryPort,
      useClass: MessageQueryAdapter,
    },
  ],
  exports: [MessageSubjectResolverRegistry],
})
export class MessagingModule {}
