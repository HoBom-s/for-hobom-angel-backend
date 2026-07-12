import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { MessageSubjectType } from "src/hb-backend-api/messaging/domain/enums/message-subject-type.enum";
import {
  ConversationParticipants,
  MessageSubjectResolver,
} from "src/hb-backend-api/messaging/domain/ports/out/message-subject-resolver";
import { ApplicationId } from "src/hb-backend-api/adoption/domain/model/vo/application-id.vo";
import { AdoptionApplicationQueryPort } from "src/hb-backend-api/adoption/domain/ports/out/adoption-application-query.port";

/**
 * Resolves an adoption application's conversation participants (its shelter and
 * applicant) for messaging, without exposing adoption internals.
 */
@Injectable()
export class AdoptionMessageSubjectResolver implements MessageSubjectResolver {
  public readonly subjectType = MessageSubjectType.ADOPTION;

  constructor(
    @Inject(DIToken.AdoptionModule.AdoptionApplicationQueryPort)
    private readonly applicationQueryPort: AdoptionApplicationQueryPort,
  ) {}

  public async resolve(
    subjectRef: string,
  ): Promise<ConversationParticipants | null> {
    let applicationId: ApplicationId;
    try {
      applicationId = ApplicationId.fromString(subjectRef);
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
