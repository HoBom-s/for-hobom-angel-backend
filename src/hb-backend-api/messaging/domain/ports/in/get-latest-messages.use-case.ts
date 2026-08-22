import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";

/** The latest message of a conversation, for an inbox preview row. */
export interface LatestMessage {
  subjectRef: string;
  body: string;
  senderRole: MessageSenderRole;
  sentAt: Date | null;
}

/**
 * Returns the most recent message for each subject in one batch — so a consumer
 * domain (e.g. inquiry) can render inbox previews without N per-thread reads.
 */
export interface GetLatestMessagesUseCase {
  invoke(
    subjectType: MessageSubjectType,
    subjectRefs: string[],
  ): Promise<LatestMessage[]>;
}
