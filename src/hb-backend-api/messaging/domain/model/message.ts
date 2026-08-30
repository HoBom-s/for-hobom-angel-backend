import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { MessageId } from "src/hb-backend-api/messaging/domain/model/vo/message-id.vo";
import { InvalidInputError } from "src/shared/exception/domain-exception";

/**
 * One message in a subject-scoped conversation (an adoption/foster application).
 * Append-only — there is no thread aggregate; a conversation is the set of
 * messages sharing a (subjectType, subjectRef), and participation is resolved
 * fresh at post/read time.
 */
export class Message {
  private static readonly MAX_BODY = 4000;

  private constructor(
    private readonly id: MessageId,
    private readonly subjectType: MessageSubjectType,
    private readonly subjectRef: string,
    private readonly senderId: UserId,
    private readonly senderRole: MessageSenderRole,
    private readonly body: string,
    private readonly sentAt: Date | null,
  ) {}

  public static write(params: {
    subjectType: MessageSubjectType;
    subjectRef: string;
    senderId: UserId;
    senderRole: MessageSenderRole;
    body: string;
  }): Message {
    const body = params.body?.trim() ?? "";
    if (!body) {
      throw new InvalidInputError("메시지 내용이 필요해요.");
    }
    if (body.length > Message.MAX_BODY) {
      throw new InvalidInputError(
        `메시지는 최대 ${Message.MAX_BODY}자까지예요.`,
      );
    }
    return new Message(
      MessageId.generate(),
      params.subjectType,
      params.subjectRef,
      params.senderId,
      params.senderRole,
      body,
      null,
    );
  }

  public static reconstitute(params: {
    id: MessageId;
    subjectType: MessageSubjectType;
    subjectRef: string;
    senderId: UserId;
    senderRole: MessageSenderRole;
    body: string;
    sentAt: Date | null;
  }): Message {
    return new Message(
      params.id,
      params.subjectType,
      params.subjectRef,
      params.senderId,
      params.senderRole,
      params.body,
      params.sentAt,
    );
  }

  public get getId(): MessageId {
    return this.id;
  }
  public get getSubjectType(): MessageSubjectType {
    return this.subjectType;
  }
  public get getSubjectRef(): string {
    return this.subjectRef;
  }
  public get getSenderId(): UserId {
    return this.senderId;
  }
  public get getSenderRole(): MessageSenderRole {
    return this.senderRole;
  }
  public get getBody(): string {
    return this.body;
  }
  /** Persisted send time; null on a just-written, not-yet-stored message. */
  public get getSentAt(): Date | null {
    return this.sentAt;
  }
}
