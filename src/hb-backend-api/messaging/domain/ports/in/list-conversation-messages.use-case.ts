import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";

export interface ListConversationMessagesQuery {
  subjectType: MessageSubjectType;
  subjectRef: string;
  /** The reader — must be a participant of the conversation. */
  readerId: string;
}

/**
 * Lists a conversation's messages in order. Only the applicant or the shelter's
 * staff/admin may read.
 */
export interface ListConversationMessagesUseCase {
  invoke(query: ListConversationMessagesQuery): Promise<Message[]>;
}
