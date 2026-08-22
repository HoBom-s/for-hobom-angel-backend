import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";

/** Persistence contract over the messages collection (append-only). */
export interface MessageRepository {
  insert(doc: Partial<MessageEntity>): Promise<void>;
  findBySubject(
    subjectType: MessageSubjectType,
    subjectRef: string,
  ): Promise<MessageEntity[]>;
  /** The most recent message for each of the given subjects (inbox previews). */
  findLatestBySubjects(
    subjectType: MessageSubjectType,
    subjectRefs: string[],
  ): Promise<MessageEntity[]>;
}
