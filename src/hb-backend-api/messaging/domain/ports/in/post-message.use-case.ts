import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";

export interface PostMessageCommand {
  subjectType: MessageSubjectType;
  subjectRef: string;
  /** The sender — must be the applicant or the shelter's staff/admin. */
  senderId: string;
  body: string;
}

export interface PostMessageResult {
  messageId: string;
}

/**
 * Posts a message to an application's conversation. Only the applicant or the
 * shelter's staff/admin may post.
 */
export interface PostMessageUseCase {
  invoke(command: PostMessageCommand): Promise<PostMessageResult>;
}
