import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { MessageSenderRole } from "src/hb-backend-api/messaging/domain/enums/message-sender-role.enum";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import { Message } from "src/hb-backend-api/messaging/domain/model/message";

const write = (body: string) =>
  Message.write({
    subjectType: MessageSubjectType.ADOPTION,
    subjectRef: "app-1",
    senderId: UserId.generate(),
    senderRole: MessageSenderRole.APPLICANT,
    body,
  });

describe("Message", () => {
  it("trims the body and has no send time until stored", () => {
    const message = write("  안녕하세요  ");
    expect(message.getBody).toBe("안녕하세요");
    expect(message.getSenderRole).toBe(MessageSenderRole.APPLICANT);
    expect(message.getSentAt).toBeNull();
  });

  it("rejects an empty body", () => {
    expect(() => write("   ")).toThrow("내용");
  });

  it("rejects an over-long body", () => {
    expect(() => write("a".repeat(4001))).toThrow("최대");
  });
});
