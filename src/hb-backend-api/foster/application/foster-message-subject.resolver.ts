import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  ConversationParticipants,
  MessageSubjectResolver,
} from "src/hb-backend-api/messaging/domain/ports/out/message-subject-resolver";
import { FosterApplicationId } from "src/hb-backend-api/foster/domain/model/vo/foster-application-id.vo";
import { FosterApplicationQueryPort } from "src/hb-backend-api/foster/domain/ports/out/foster-application-query.port";

/**
 * Resolves a foster application's conversation participants (its shelter and
 * applicant) for messaging, without exposing foster internals.
 */
@Injectable()
export class FosterMessageSubjectResolver implements MessageSubjectResolver {
  public readonly subjectType = MessageSubjectType.FOSTER;

  constructor(
    @Inject(DIToken.FosterModule.FosterApplicationQueryPort)
    private readonly applicationQueryPort: FosterApplicationQueryPort,
  ) {}

  public async resolve(
    subjectRef: string,
  ): Promise<ConversationParticipants | null> {
    let applicationId: FosterApplicationId;
    try {
      applicationId = FosterApplicationId.fromString(subjectRef);
    } catch {
      return null;
    }
    const application = await this.applicationQueryPort.findById(applicationId);
    if (!application) {
      return null;
    }
    return {
      shelterId: application.getShelterId.toString(),
      applicantId: application.getApplicantId.toString(),
    };
  }
}
