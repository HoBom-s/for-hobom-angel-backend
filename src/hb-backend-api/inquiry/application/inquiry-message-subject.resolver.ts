import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  ConversationParticipants,
  MessageSubjectResolver,
} from "src/hb-backend-api/messaging/domain/ports/out/message-subject-resolver";
import { InquiryId } from "src/hb-backend-api/inquiry/domain/model/vo/inquiry-id.vo";
import { InquiryQueryPort } from "src/hb-backend-api/inquiry/domain/ports/out/inquiry-query.port";

/**
 * Resolves an inquiry thread's participants (its shelter and the inquirer) for
 * messaging, without exposing inquiry internals — the inquirer takes the
 * "applicant" side of the conversation.
 */
@Injectable()
export class InquiryMessageSubjectResolver implements MessageSubjectResolver {
  public readonly subjectType = MessageSubjectType.INQUIRY;

  constructor(
    @Inject(DIToken.InquiryModule.InquiryQueryPort)
    private readonly inquiryQueryPort: InquiryQueryPort,
  ) {}

  public async resolve(
    subjectRef: string,
  ): Promise<ConversationParticipants | null> {
    let inquiryId: InquiryId;
    try {
      inquiryId = InquiryId.fromString(subjectRef);
    } catch {
      return null;
    }
    const inquiry = await this.inquiryQueryPort.findById(inquiryId);
    if (!inquiry) {
      return null;
    }
    return {
      shelterId: inquiry.getShelterId.toString(),
      applicantId: inquiry.getInquirerId.toString(),
    };
  }
}
