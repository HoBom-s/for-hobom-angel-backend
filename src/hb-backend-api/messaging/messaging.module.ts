import { Module, OnModuleInit } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DIToken } from "src/shared/di/token.di";
import { DestroyerRegistry } from "src/shared/erasure/destroyer.registry";
import { ErasureModule } from "src/shared/erasure/erasure.module";
import { UserModule } from "src/hb-backend-api/user/user.module";
import { MessageDestroyer } from "src/hb-backend-api/messaging/adapters/erasure/message.destroyer";
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
    ErasureModule,
  ],
  controllers: [MessageController],
  providers: [
    MessageSubjectResolverRegistry,
    ConversationAccessService,
    MessageDestroyer,
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
  exports: [
    MessageSubjectResolverRegistry,
    DIToken.MessagingModule.PostMessageUseCase,
  ],
})
export class MessagingModule implements OnModuleInit {
  constructor(
    private readonly destroyerRegistry: DestroyerRegistry,
    private readonly messageDestroyer: MessageDestroyer,
  ) {}

  public onModuleInit(): void {
    this.destroyerRegistry.register(this.messageDestroyer);
  }
}
