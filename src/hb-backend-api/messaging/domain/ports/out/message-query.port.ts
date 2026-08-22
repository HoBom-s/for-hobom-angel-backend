import { Message } from "src/hb-backend-api/messaging/domain/model/message";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";

/** Read-side port for messages. */
export interface MessageQueryPort {
  listBySubject(
    subjectType: MessageSubjectType,
    subjectRef: string,
  ): Promise<Message[]>;
  /** The most recent message for each of the given subjects (inbox previews). */
  findLatestBySubjects(
    subjectType: MessageSubjectType,
    subjectRefs: string[],
  ): Promise<Message[]>;
}
