import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";
import { MessageEntity } from "src/hb-backend-api/messaging/domain/model/message.entity";
import { MessageId } from "src/hb-backend-api/messaging/domain/model/vo/message-id.vo";

export function toDomain(doc: MessageEntity): Message {
  return Message.reconstitute({
    id: MessageId.fromString(String(doc._id)),
    subjectType: doc.subjectType,
    subjectRef: doc.subjectRef,
    senderId: UserId.fromString(String(doc.senderId)),
    senderRole: doc.senderRole,
    body: doc.body,
    sentAt: doc.createdAt ?? null,
  });
}

export function toInsertDoc(message: Message): Partial<MessageEntity> {
  return {
    _id: message.getId.raw,
    subjectType: message.getSubjectType,
    subjectRef: message.getSubjectRef,
    senderId: message.getSenderId.raw,
    senderRole: message.getSenderRole,
    body: message.getBody,
  };
}
